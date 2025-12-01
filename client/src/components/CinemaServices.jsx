import React, { useState, useEffect } from "react";
import { Plus, Minus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const packagesData = [
  {
    title: "Business Meetings",
    image: assets.businessPac,
    desc: "Bored of the same old meeting rooms? Looking for a fresh, exciting setting? Host your next meeting at Century Cinema. Picture the impact of a private auditorium featuring a massive wall-to-wall screen, Dolby Digital surround sound, and the latest digital projection technology. It's guaranteed to elevate your event and leave a lasting impression. Want to add some fun? Wrap up with a movie after your meeting!",
  },
  {
    title: "Private Screening",
    image: assets.privateScreening,
    desc: "Now booking private rentals for groups of 200 or more! Whether it's an employee incentive, birthday party, or a gathering with friends and family, there's no better way to celebrate than in your very own private auditorium. For more details, reach out to your local theatre directly or fill out the form below, and someone will get in touch with you. After all, who doesn't love a night out at the movies?",
  },
  {
    title: "School Package",
    image: assets.schoolPackage,
    desc: "All kids love going to the movies! What better way to reward or motivate them than with a fun trip to the theater? We offer special discount packages for groups of 200 or more, which can include popcorn or a drink. We can also have concessions ready and waiting, so students can pick their favorite snacks.",
  },
  {
    title: "Special Events",
    image: assets.specialEvent,
    desc: "Looking for the perfect venue to celebrate the holidays or a special occasion? Your search ends here. Our experienced team is ready to assist in planning your event and ensuring it's truly unforgettable.",
  },
  {
    title: "Corporate Celebrations",
    image: assets.compare,
    desc: "Appreciate your valued clients, or celebrate a special occasion with a movie! You can offer guests popcorn and other snacks, or even book a dine-in theater for an immersive experience.",
  },
  {
    title: "Movies",
    image: assets.Party,
    desc: "Reserve a private auditorium for an exclusive film screening with your invited guests. You have the flexibility to customize every detail—from choosing the time and date to selecting the auditorium size and adding extra time in the theater.",
  },
];

const CinemaServices = () => {
  const [expandedCards, setExpandedCards] = useState({});
  const [charLimit, setCharLimit] = useState(300);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [modalData, setModalData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleExpand = (title) => {
    setExpandedCards((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const openModal = (pkg) => setModalData(pkg);
  const closeModal = () => setModalData(null);

  const shouldTruncate = (desc) =>
    windowWidth >= 1280 && desc.length > charLimit; // only XL+

  const handleReserveClick = (eventType) => {
    navigate("/reserve", { state: { events: eventType } });
  };

  return (
    <div id="CinemaServices">
      <section className="py-20 px-4 sm:px-6 md:px-8 xl:px-24 bg-gradient-to-b from-gray-900 via-black to-gray-900 text-gray-100">
        <div className="text-center mt-20 mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-wide mb-4">
            Packages for Every Occasion
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Our cinema offers tailored packages to make your event truly special —
            whether for business, school, or fun.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-[1550px] mx-auto items-start">
          {packagesData.map((pkg) => {
            const isExpanded = expandedCards[pkg.title] || false;
            const needsExpand = shouldTruncate(pkg.desc);

            return (
              <div
                key={pkg.title}
                className="group p-8 rounded-2xl bg-gray-900 border border-gray-800 hover:border-primary hover:shadow-[0_0_25px_-5px_rgba(255,200,0,0.5)] transition-all duration-300 flex flex-col min-h-[400px]"
              >
                {/* Image */}
                {pkg.image && (
                  <div
                    className="mb-6 overflow-clip rounded-xl cursor-pointer"
                    onClick={() => openModal(pkg)}
                  >
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-68 object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3 text-center group-hover:text-primary transition">
                  {pkg.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-gray-400 text-justify transition-[max-height] duration-500 overflow-hidden flex-grow ${
                    !isExpanded && needsExpand ? "line-clamp-3" : "line-clamp-none"
                  }`}
                >
                  {pkg.desc}
                </p>

                {/* Buttons */}
                <div className="mt-4 flex items-center">
                  <button
                    onClick={() => handleReserveClick(pkg.title)}
                    className="bg-primary-dull text-primary font-semibold py-2 px-3 sm:px-4 rounded-lg hover:bg-primary hover:text-primary-dull transition text-sm sm:text-base"
                  >
                    Reserve Now
                  </button>

                  {/* Show (+,-) only on XL and needsExpand */}
                  {windowWidth >= 1280 && needsExpand && (
                    <button
                      onClick={() => toggleExpand(pkg.title)}
                      className="flex items-center gap-2 text-primary hover:text-amber-400 transition font-medium ml-auto"
                    >
                      {isExpanded ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full relative p-6">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-red-500"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={modalData.image}
              alt={modalData.title}
              className="w-full h-80 object-cover rounded-xl mb-4"
            />
            <h3 className="text-2xl font-bold text-primary mb-2">{modalData.title}</h3>
            <p className="text-gray-400">{modalData.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CinemaServices;
