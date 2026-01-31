import React from "react";
import { FaHome, FaPhoneAlt, FaEnvelope, FaWhatsapp, FaSkype } from "react-icons/fa";

const Address = () => {
  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: "var(--smoke-color)" }}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-extrabold mb-4"
            style={{ color: "var(--title-color)" }}
          >
            Contact Us
          </h1>
          <p
            className="text-lg"
            style={{ color: "var(--body-color)" }}
          >
            We’d love to hear from you. Reach us anytime.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8">

      {/* Dhaka Office */}
<div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 transition-all hover:shadow-xl"
     style={{ borderTopColor: "#C59D5F" }}>

  <h2
    className="text-2xl font-bold mb-4 flex items-center gap-3"
    style={{ color: "#C59D5F" }}
  >
    <FaHome /> Dhaka Office
  </h2>

  <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--body-color)" }}>
    House # 33A (4th Floor), Road # 4, Dhanmondi, Dhaka-1205, Bangladesh
  </p>

  <ul className="space-y-3 text-sm">
    <li className="flex items-center gap-3">
      <FaPhoneAlt style={{ color: "#C59D5F" }} />
      <a href="tel:+8801814445932" className="hover:underline">
        +880-1814-445932
      </a>
    </li>

    <li className="flex items-center gap-3">
      <FaWhatsapp style={{ color: "#C59D5F" }} />
      <a
        href="https://wa.me/8801958666999"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        +880-1958-666999
      </a>
    </li>

    <li className="flex items-center gap-3">
      <FaEnvelope style={{ color: "#C59D5F" }} />
      <div>
        <a href="mailto:sales@iglweb.com" className="block hover:underline">
          sales@iglweb.com
        </a>
        <a href="mailto:support@iglweb.com" className="block hover:underline">
          support@iglweb.com
        </a>
        <a href="mailto:accounts@iglweb.com" className="block hover:underline">
          accounts@iglweb.com
        </a>
      </div>
    </li>

    <li className="flex items-center gap-3">
      <FaSkype style={{ color: "#C59D5F" }} />
      <a
        href="skype:iglweb.com?chat"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        iglweb.com
      </a>
    </li>
  </ul>
</div>

{/* Chittagong Office */}
<div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 transition-all hover:shadow-xl"
     style={{ borderTopColor: "#C59D5F" }}>

  <h2
    className="text-2xl font-bold mb-4 flex items-center gap-3"
    style={{ color: "#C59D5F" }}
  >
    <FaHome /> Chittagong Office
  </h2>

  <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--body-color)" }}>
    House # 201 (3rd Floor), Gulbagh Residential Area-2, Access Road,
    Agarabad, Chittagong, Bangladesh
  </p>

  <ul className="space-y-3 text-sm">
    <li className="flex items-center gap-3">
      <FaPhoneAlt style={{ color: "#C59D5F" }} />
      <a href="tel:+8801814445932" className="hover:underline">
        +880-1814-445932
      </a>
    </li>

    <li className="flex items-center gap-3">
      <FaWhatsapp style={{ color: "#C59D5F" }} />
      <a
        href="https://wa.me/8801958666999"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        +880-1958-666999
      </a>
    </li>

    <li className="flex items-center gap-3">
      <FaSkype style={{ color: "#C59D5F" }} />
      <a
        href="skype:iglweb.com?chat"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        iglweb.com
      </a>
    </li>
  </ul>
</div>

        </div>

        {/* Bottom Banner */}
        <div
          className="mt-16 rounded-xl p-8 text-center text-white font-bold text-3xl tracking-wide"
          style={{ backgroundColor: "var(--theme-color)" }}
        >
          CONTACT US ANYTIME
        </div>
      </div>
    </div>
  );
};

export default Address;
