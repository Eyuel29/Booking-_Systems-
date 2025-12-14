import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BlurCircle from "../components/BlurCircle";
import { XCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { initializePayment } = useAppContext();
  
  const [retrying, setRetrying] = React.useState(false);
  
  const bookingId = searchParams.get("booking_id");
  const errorMessage = searchParams.get("message") || "Payment was cancelled or failed";

  const handleRetry = async () => {
    if (!bookingId) {
      toast.error("No booking ID found. Please try from My Bookings.");
      navigate("/my-bookings");
      return;
    }

    setRetrying(true);

    try {
      const response = await initializePayment(bookingId);

      if (response.success && response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        toast.error(response.message || "Failed to initialize payment");
        setRetrying(false);
      }
    } catch (error) {
      console.error("Payment retry error:", error);
      toast.error("Failed to retry payment. Please try again.");
      setRetrying(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-8 md:px-16 lg:px-32 xl:px-40 pt-28 md:pt-36 overflow-x-hidden">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" right="600px" />

      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 md:p-12 text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />

          <h1 className="text-3xl md:text-4xl font-bold text-red-500 mb-4">
            Payment Failed
          </h1>

          <p className="text-gray-300 mb-6">{errorMessage}</p>

          <div className="bg-gray-800/30 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-amber-400 mb-3">What happened?</h3>
            <ul className="text-sm text-gray-300 text-left space-y-2">
              <li>• Your payment was not processed</li>
              <li>• Your booking is still reserved but unpaid</li>
              <li>• You can try again or choose a different payment method</li>
              <li>• No charges were made to your account</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {bookingId && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="bg-primary px-8 py-3 rounded-full font-medium text-white hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {retrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => navigate("/my-bookings")}
              className="border border-primary/50 px-8 py-3 rounded-full font-medium text-white hover:bg-primary/10 transition"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate("/")}
              className="border border-gray-500/50 px-8 py-3 rounded-full font-medium text-gray-300 hover:bg-gray-500/10 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
