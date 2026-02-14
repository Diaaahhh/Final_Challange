import React from "react";
import { useCart } from "./CartContext";
import { FaTrashAlt, FaPlus, FaMinus } from "react-icons/fa";
import { IMAGE_BASE_URL } from "../../config";

// const IMAGE_BASE_URL = "https://backend.khabartable.com";

export default function Cart() {
  const { cartItems, handleAddToCart, removeFromCart, cartTotal } = useCart();

  // --- FIXED SHIPPING LOGIC ---
  const SHIPPING_COST = 100;
  const grandTotal = cartTotal + SHIPPING_COST;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-white min-h-screen">
      {cartItems.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-xl">
          Your cart is empty.
        </div>
      ) : (
        // Flex Container for Side-by-Side Layout
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* LEFT SIDE: Product Table */}
          <div className="w-full xl:w-2/3">
            <form action="#" className="woocommerce-cart-form">
              <table className="cart_table w-full border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className="cart-col-image bg-gray-100 p-4 text-left border-b text-gray-900 font-bold">
                      Image
                    </th>
                    <th className="cart-col-productname bg-gray-100 p-4 text-left border-b text-gray-900 font-bold">
                      Product Name
                    </th>
                    <th className="cart-col-price bg-gray-100 p-4 text-left border-b text-gray-900 font-bold">
                      Price
                    </th>
                    <th className="cart-col-quantity bg-gray-100 p-4 text-left border-b text-gray-900 font-bold">
                      Quantity
                    </th>
                    <th className="cart-col-total bg-gray-100 p-4 text-left border-b text-gray-900 font-bold">
                      Total
                    </th>
                    <th className="cart-col-remove bg-gray-100 p-4 text-left border-b text-gray-900 font-bold">
                      Remove
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr
                      className="cart_item border-b border-gray-200"
                      key={item.id}
                    >
                      <td data-title="Product" className="p-4">
                        <a className="cart-productimage block w-max" href="#">
                          <img
                            src={
                              item.m_image
                                ? `${IMAGE_BASE_URL}/${item.m_image}`
                                : "assets/img/product/placeholder.png"
                            }
                            alt={item.m_menu_name}
                            className="w-[91px] h-[91px] object-cover rounded-md block"
                          />
                        </a>
                      </td>
                      <td data-title="Name" className="p-4">
                        <a
                          className="cart-productname text-gray-800 font-bold hover:text-amber-500 transition"
                          href="#"
                        >
                          {item.m_menu_name}
                        </a>
                      </td>
                      <td data-title="Price" className="p-4">
                        <span className="amount font-bold text-amber-600">
                          <bdi>
                            <span>Tk </span>
                            {Number(item.m_price).toLocaleString()}
                          </bdi>
                        </span>
                      </td>
                      <td data-title="Quantity" className="p-4">
                        <div className="quantity flex items-center gap-2">
                          <button
                            type="button"
                                    className="p-1.5 rounded-md bg-white text-gray-600 hover:bg-amber-100 hover:text-amber-600 transition-colors shadow-sm"
                            onClick={() => handleAddToCart(item, -1)}
                          >
                            <FaMinus size={10} />
                          </button>
                          <input
                            type="number"
                            className="qty-input w-12 text-center border border-gray-300 rounded mx-1 p-1"
                            value={item.quantity}
                            readOnly
                          />
                          <button
                            type="button"
                            className="quantity-plus qty-btn bg-amber-500 text-white p-2 rounded hover:bg-amber-600 transition"
                            onClick={() => handleAddToCart(item, 1)}
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                      </td>
                      <td data-title="Total" className="p-4">
                        <span className="amount font-bold text-gray-900">
                          <bdi>
                            <span>Tk </span>
                            {(
                              Number(item.m_price) * item.quantity
                            ).toLocaleString()}
                          </bdi>
                        </span>
                      </td>
                      <td data-title="Remove" className="p-4">
                        <button
                          type="button"
                          className="remove text-red-500 hover:text-red-700 transition"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Coupon Row */}
                  {/* <tr>
                            <td colSpan="6" className="actions p-4 bg-gray-50 border-t">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="th-cart-coupon flex gap-2 w-full sm:w-auto">
                                        <input type="text" className="form-control border p-2 rounded w-full" placeholder="Coupon Code..." />
                                        <button type="submit" className="th-btn bg-gray-800 text-white px-6 py-2 rounded font-bold hover:bg-gray-900 transition whitespace-nowrap">
                                            Apply Coupon
                                        </button>
                                    </div>
                                    
                                </div>
                            </td>
                        </tr> */}
                </tbody>
              </table>
            </form>
          </div>

          {/* RIGHT SIDE: Cart Totals Form */}
          <div className="w-full xl:w-1/3">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Cart Totals
              </h2>

              <table className="cart_totals w-full mb-6">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 text-left font-medium text-gray-600">
                      Cart Subtotal
                    </th>
                    <td className="py-3 text-right font-bold text-gray-800">
                      <span className="amount">
                        <bdi>
                          <span>Tk </span>
                          {cartTotal.toLocaleString()}
                        </bdi>
                      </span>
                    </td>
                  </tr>

                  {/* Shipping Row - Fixed 60 Tk */}
                  <tr className="shipping border-b border-gray-200">
                    <th className="py-4 text-left font-medium text-gray-600 align-top">
                      Shipping
                    </th>
                    <td className="py-4 text-right">
                      <div className="mb-2 font-bold text-gray-800">
                        <span className="py-3 text-right font-bold text-gray-800">
                          Tk {SHIPPING_COST}
                        </span>
                      </div>
                      {/* <p className="text-sm text-gray-500 mb-4 text-left">
                                        Shipping options will be updated during checkout.
                                    </p> */}

                      {/* Calculator Form */}
                      {/* <form action="#" method="post" className="text-left">
                                        <a href="#" className="shipping-calculator-button text-amber-600 font-semibold mb-3 block hover:underline">Change address</a>
                                        <div className="shipping-calculator-form space-y-3">
                                            <select className="form-select w-full border p-2 rounded bg-white text-gray-700">
                                                <option value="BD">Bangladesh</option>
                                                <option value="AR">Argentina</option>
                                                <option value="AM">Armenia</option>
                                            </select>
                                            <select className="form-select w-full border p-2 rounded bg-white text-gray-700">
                                                <option value="">Select an option…</option>
                                                <option value="BD-06">Barishal</option>
                                                <option value="BD-05">Bagerhat</option>
                                                <option value="BD-01">Bandarban</option>
                                            </select>
                                            <input type="text" className="form-control w-full border p-2 rounded" placeholder="Town / City" />
                                            <input type="text" className="form-control w-full border p-2 rounded" placeholder="Postcode / ZIP" />
                                            <button className="th-btn bg-gray-200 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-300 font-bold transition w-full">
                                                Update
                                            </button>
                                        </div>
                                    </form> */}
                    </td>
                  </tr>

                  {/* Order Total Row */}
                  <tr className="order-total border-b border-gray-200">
                    <th className="py-4 text-left font-bold text-lg text-gray-800">
                      Order Total
                    </th>
                    <td className="py-4 text-right">
                      <strong>
                        <span className="amount text-xl text-amber-600 font-bold">
                          <bdi>
                            <span>Tk </span>
                            {grandTotal.toLocaleString()}
                          </bdi>
                        </span>
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="wc-proceed-to-checkout">
                <a
                  href="/checkout"
                  className="th-btn bg-amber-500 text-white w-full block text-center py-3 rounded-md font-bold text-lg hover:bg-amber-600 transition shadow-md"
                >
                  Proceed to checkout
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
