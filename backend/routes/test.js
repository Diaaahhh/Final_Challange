const axios = require("axios");

router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: "Phone required" });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP
    otpStore[phone] = otp;

    // Format phone (8801XXXXXXXXX)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
        formattedPhone = '88' + formattedPhone;
    }

    try {
        // EXACT SAME AS YOUR WORKING URL
    const smsResponse = await axios.get(
    "http://sms.iglweb.com/api/v1/send",
    {
        params: {
            api_key: "4451773340833151773340833",
            contacts: formattedPhone,
            senderid: "01844532630",
            msg: `Your checkout OTP is ${otp}. Please do not share this with anyone.`
        },
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*",
            "Connection": "keep-alive"
        }
    }
);
        console.log("SMS API RESPONSE:", smsResponse.data);

        return res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.error("SMS ERROR:");

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }

        return res.status(500).json({
            success: false,
            message: "Failed to send SMS"
        });
    }
});