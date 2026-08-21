import React, { useRef, useEffect } from "react";

function PopUpModal({ modalItems = [], modalTitle = "", setIsModalOpen }) {
  const modalRef = useRef(null);

  const hasScroll = modalItems?.length > 8;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        {/* Header */}
        <div className="bg-blue-800 text-white px-4 py-3 flex justify-between items-center rounded-t-lg">
          <h2 className="text-sm font-semibold">{modalTitle}</h2>

          <button
            onClick={() => setIsModalOpen(false)}
            className="text-xl font-bold leading-none hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div
          className={`p-4 grid grid-cols-2 gap-3 ${hasScroll ? "max-h-64 overflow-y-auto pr-2" : ""
            }`}
        >
          {modalItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center text-gray-800 text-sm"
            >
              <i className="fa-solid fa-circle-dot text-gray-400 mr-2 text-xs"></i>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PopUpModal;
