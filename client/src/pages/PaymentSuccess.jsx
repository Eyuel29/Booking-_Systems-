import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment } = useAppContext();
  
  const [verifying, setVerifying] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");

    if (!txRef) {
      setError("No transaction reference found");
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyPayment(txRef);

        if (response.success) {
          setPaymentData(response.payment);
          toast.success("Payment verified successfully!");
        } else {
          setError(response.message || "Payment verification failed");
          toast.error(response.message || "Payment verification failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Failed to verify payment. Please contact support.");
        toast.error("Failed to verify payment");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [searchParams, verifyPayment]);

  if (verifying) {
    return <Loading />;
  }

  const StatusIcon = error ? XCircle : paymentData?.status === "success" ? CheckCircle : AlertCircle;
  const statusColor = error ? "text-red-500" : paymentData?.status === "success" ? "text-green-500" : "text-yellow-500";
  const statusBg = error ? "bg-red-500/10" : paymentData?.status === "success" ? "bg-green-500/10" : "bg-yellow-500/10";

  return (
    <div className="relative min-h-screen px-4 sm:px-8 md:px-16 lg:px-32 xl:px-40 pt-28 md:pt-36 overflow-x-hidden">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" right="600px" />

      <div className="max-w-2xl mx-auto">
        <div className={`${statusBg} border ${error ? "border-red-500/20" : paymentData?.status === "success" ? "border-green-500/20" : "border-yellow-500/20"} rounded-2xl p-8 md:p-12 text-center`}>
          <StatusIcon className={`w-20 h-20 ${statusColor} mx-auto mb-6`} />

          <h1 className={`text-3xl md:text-4xl font-bold ${statusColor} mb-4`}>
            {error ? "Payment Verification Failed" : paymentData?.status === "success" ? "Payment Successful!" : "Payment Pending"}
          </h1>

          {error ? (
            <div>
              <p className="text-gray-300 mb-6">{error}</p>
              <p className="text-sm text-gray-400 mb-8">
                If you were charged, please contact support with your transaction reference.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-6">
                {paymentData?.status === "success"
                  ? "Your booking has been confirmed and payment processed successfully."
                  : "Your payment is being processed. Please check your bookings for updates."}
              </p>

              {paymentData && (
                <div className="bg-gray-800/30 rounded-lg p-6 mb-8 text-left">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction Ref:</span>
                      <span className="text-white font-mono">{paymentData.tx_ref}</span>
                    </div>
                    {paymentData.reference && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reference:</span>
                        <span className="text-white font-mono">{paymentData.reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-semibold">{paymentData.currency} {paymentData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-semibold ${paymentData.status === "success" ? "text-green-400" : "text-yellow-400"}`}>
                        {paymentData.status?.toUpperCase()}
                      </span>
                    </div>
                    {paymentData.method && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Method:</span>
                        <span className="text-white">{paymentData.method}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/my-bookings")}
              className="bg-primary px-8 py-3 rounded-full font-medium text-white hover:bg-primary/80 transition"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate("/")}
              className="border border-primary/50 px-8 py-3 rounded-full font-medium text-white hover:bg-primary/10 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
