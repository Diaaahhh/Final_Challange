const axios = require("axios");
const db = require("../../db"); // adjust path

// ==========================================
// GET COMPANY CODE FROM SETTINGS
// ==========================================
const getCompanyCode = () => {
    return new Promise((resolve, reject) => {
        const settingsSql =
            "SELECT company_code FROM settings WHERE id = 1";

        db.query(settingsSql, (err, result) => {

            if (err) {
                return reject(err);
            }

            const code = result[0]?.company_code;

            if (!code) {
                return reject(
                    new Error("Company code not found")
                );
            }

            resolve(code);
        });
    });
};

// ==========================================
// PROMISE WRAPPER
// ==========================================
const queryDb = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// ==========================================
// MENU SYNC
// ==========================================
const syncMenus = async () => {

    try {

        console.log("================================");
        console.log("MENU CRON STARTED");
        console.log("================================");

        const companyCode = await getCompanyCode();

        const apiUrl =
            `https://pos.khabartable.com/company/api/menus/${companyCode}`;

        const response = await axios.get(apiUrl, {
            headers: {
                Accept: "application/json"
            }
        });

        if (
            typeof response.data === "string" &&
            response.data.includes("<!doctype html>")
        ) {
            throw new Error("Laravel login page returned");
        }

        if (
            !response.data ||
            response.data.status !== true ||
            !Array.isArray(response.data.data)
        ) {
            throw new Error("Invalid API Response");
        }

        const apiCompanyId =
            Number(response.data.company_id);

        if (apiCompanyId !== Number(companyCode)) {
            throw new Error(
                `Company mismatch POS=${apiCompanyId} LOCAL=${companyCode}`
            );
        }

        const apiMenus = response.data.data;

        // ==========================================
        // LOCAL MENUS
        // ==========================================

        const localMenus = await queryDb(`
            SELECT *
            FROM menu
        `);

        const localMenuMap = new Map();

        localMenus.forEach(menu => {
            localMenuMap.set(
                Number(menu.m_menu_id),
                menu
            );
        });

        const apiMenuIds = [];

        // ==========================================
        // INSERT / UPDATE MENUS
        // ==========================================

        for (const menu of apiMenus) {

            const menuId = Number(menu.id);

            apiMenuIds.push(menuId);

            const localMenu =
                localMenuMap.get(menuId);

            if (!localMenu) {

                await queryDb(`
                    INSERT INTO menu (
                        m_menu_id,
                        m_menu_sl,
                        m_menu_name,
                        category_id,
                        m_company_id,
                        m_branch_id,
                        m_ingredient,
                        m_cost,
                        m_price,
                        m_status
                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `, [
                    menu.id,
                    menu.m_menu_sl,
                    menu.m_menu_name,
                    menu.m_main_category,
                    menu.m_company_id,
                    menu.m_branch_id,
                    menu.m_ingredient,
                    menu.m_cost,
                    menu.m_price,
                    menu.m_status
                ]);

                console.log(
                    `Inserted menu ${menu.m_menu_name}`
                );

            } else {

                const needsUpdate =
                    localMenu.m_menu_sl !== menu.m_menu_sl ||
                    localMenu.m_menu_name !== menu.m_menu_name ||
                    String(localMenu.category_id) !== String(menu.m_main_category) ||
                    Number(localMenu.m_company_id) !== Number(menu.m_company_id) ||
                    String(localMenu.m_branch_id) !== String(menu.m_branch_id) ||
                    String(localMenu.m_ingredient) !== String(menu.m_ingredient) ||
                    Number(localMenu.m_cost) !== Number(menu.m_cost) ||
                    Number(localMenu.m_price) !== Number(menu.m_price) ||
                    Number(localMenu.m_status) !== Number(menu.m_status);

                if (needsUpdate) {

                    await queryDb(`
                        UPDATE menu
                        SET
                            m_menu_sl=?,
                            m_menu_name=?,
                            category_id=?,
                            m_company_id=?,
                            m_branch_id=?,
                            m_ingredient=?,
                            m_cost=?,
                            m_price=?,
                            m_status=?
                        WHERE m_menu_id=?
                    `, [
                        menu.m_menu_sl,
                        menu.m_menu_name,
                        menu.m_main_category,
                        menu.m_company_id,
                        menu.m_branch_id,
                        menu.m_ingredient,
                        menu.m_cost,
                        menu.m_price,
                        menu.m_status,
                        menu.id
                    ]);

                    console.log(
                        `Updated menu ${menu.m_menu_name}`
                    );
                }
            }

            // ==========================================
            // VARIANT SYNC
            // ==========================================

            if (
                Array.isArray(menu.variants)
            ) {

                const localVariants =
                    await queryDb(`
                        SELECT *
                        FROM menus_variant
                        WHERE menu_id = ?
                    `, [menuId]);

                const localVariantMap =
                    new Map();

                localVariants.forEach(v => {
                    localVariantMap.set(
                        Number(v.variant_id),
                        v
                    );
                });

                const apiVariantIds = [];

                for (const variant of menu.variants) {

                    apiVariantIds.push(
                        Number(variant.variant_id)
                    );

                    const localVariant =
                        localVariantMap.get(
                            Number(
                                variant.variant_id
                            )
                        );

                    if (!localVariant) {

                        await queryDb(`
                            INSERT INTO menus_variant (
                                menu_id,
                                variant_id,
                                variant_name,
                                cost,
                                price
                            )
                            VALUES (
                                ?, ?, ?, ?, ?
                            )
                        `, [
                            menuId,
                            variant.variant_id,
                            variant.variant_name,
                            variant.cost,
                            variant.price
                        ]);

                    } else {

                        const needsVariantUpdate =
                            localVariant.variant_name !== variant.variant_name ||
                            Number(localVariant.cost) !== Number(variant.cost) ||
                            Number(localVariant.price) !== Number(variant.price);

                        if (needsVariantUpdate) {

                            await queryDb(`
                                UPDATE menus_variant
                                SET
                                    variant_name=?,
                                    cost=?,
                                    price=?
                                WHERE
                                    menu_id=?
                                AND
                                    variant_id=?
                            `, [
                                variant.variant_name,
                                variant.cost,
                                variant.price,
                                menuId,
                                variant.variant_id
                            ]);
                        }
                    }
                }

                // DELETE REMOVED VARIANTS

                for (const localVariant of localVariants) {

                    if (
                        !apiVariantIds.includes(
                            Number(
                                localVariant.variant_id
                            )
                        )
                    ) {

                        await queryDb(`
                            DELETE FROM menus_variant
                            WHERE id = ?
                        `, [
                            localVariant.id
                        ]);

                        console.log(
                            `Deleted variant ${localVariant.variant_name}`
                        );
                    }
                }
            }
        }

        // ==========================================
        // DELETE REMOVED MENUS
        // ==========================================

        for (const localMenu of localMenus) {

            if (
                !apiMenuIds.includes(
                    Number(localMenu.m_menu_id)
                )
            ) {

                await queryDb(`
                    DELETE FROM menus_variant
                    WHERE menu_id = ?
                `, [
                    localMenu.m_menu_id
                ]);

                await queryDb(`
                    DELETE FROM menu
                    WHERE m_menu_id = ?
                `, [
                    localMenu.m_menu_id
                ]);

                console.log(
                    `Deleted menu ${localMenu.m_menu_name}`
                );
            }
        }

        console.log("================================");
        console.log("MENU CRON COMPLETED");
        console.log("================================");

    } catch (error) {

        console.error(
            "MENU CRON ERROR:",
            error.message
        );
    }
};

// ==========================================
// RUN
// ==========================================
syncMenus();

module.exports = syncMenus;