import { useState, useEffect } from "react";
import { Heart, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface DonationBannerProps {
  goal?: number;
  paypalEmail?: string;
}

const DonationBanner = ({ 
  goal = 500, 
  paypalEmail = "bhoel86@gmail.com" 
}: DonationBannerProps) => {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load saved amount from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('donation_amount');
    if (saved) {
      setCurrentAmount(parseFloat(saved));
    }
  }, []);

  const progress = Math.min((currentAmount / goal) * 100, 100);
  const remaining = Math.max(goal - currentAmount, 0);

  // PayPal.me link
  const paypalLink = `https://www.paypal.com/paypalme/bhoel86`;

  const handleDonateClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    window.open(paypalLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10 border border-pink-500/20 rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-3">
          <div 
            className={`p-2 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white ${
              isAnimating ? 'animate-pulse scale-110' : ''
            } transition-transform`}
          >
            <Heart className="w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Support Justachat™</h3>
            <p className="text-xs text-muted-foreground">Help us keep the servers running!</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              ${currentAmount.toFixed(2)} raised
            </span>
            <span className="text-sm text-muted-foreground">
              Goal: ${goal}
            </span>
          </div>
          <Progress value={progress} className="h-3 bg-muted" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {progress.toFixed(0)}% complete
            </span>
            <span className="text-xs font-medium text-pink-500">
              ${remaining.toFixed(2)} to go!
            </span>
          </div>
        </div>

        {/* Donate Button */}
        <Button
          onClick={handleDonateClick}
          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
        >
          <Heart className="w-4 h-4" />
          Donate
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default DonationBanner;
