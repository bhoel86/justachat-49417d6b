import { useState, useEffect } from "react";
import { Heart, X, Pencil } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import paypalQr from "@/assets/paypal-qr.png";

const DonationBanner = () => {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [goalAmount, setGoalAmount] = useState(500);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { isOwner, isAdmin, user } = useAuth();

  // Fetch donation settings from database
  useEffect(() => {
    const fetchDonationSettings = async () => {
      const { data, error } = await supabase
        .from('donation_settings')
        .select('current_amount, goal_amount')
        .limit(1)
        .maybeSingle();
      
      if (data && !error) {
        setCurrentAmount(Number(data.current_amount));
        setGoalAmount(Number(data.goal_amount));
      }
    };

    fetchDonationSettings();
  }, []);

  const progress = Math.min((currentAmount / goalAmount) * 100, 100);
  const remaining = Math.max(goalAmount - currentAmount, 0);

  const handleDonateClick = async () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    setShowQrModal(true);
    
    // Only send SMS for logged-in users who haven't clicked before
    if (!user) return;
    
    try {
      // Check if user has already clicked donate before
      const { data: existingClick } = await supabase
        .from('donation_clicks')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // If already clicked, don't send another SMS
      if (existingClick) {
        console.log('User already clicked donate before, skipping SMS');
        return;
      }
      
      // Get username for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Record this click to prevent future SMS
      await supabase
        .from('donation_clicks')
        .insert({ user_id: user.id, username: profile?.username || 'Unknown' });
      
      // Send SMS notification
      await supabase.functions.invoke('donation-notify', {
        body: { username: profile?.username || 'A user' }
      });
      
      console.log('Donation notification sent for:', profile?.username);
    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.error('Failed to send donation notification:', error);
    }
  };

  const handleEditClick = () => {
    setEditAmount(currentAmount.toString());
    setEditGoal(goalAmount.toString());
    setShowEditModal(true);
  };

  const handleUpdateDonation = async () => {
    const newAmount = parseFloat(editAmount);
    const newGoal = parseFloat(editGoal);

    if (isNaN(newAmount) || isNaN(newGoal) || newAmount < 0 || newGoal <= 0) {
      toast.error("Please enter valid amounts");
      return;
    }

    setIsUpdating(true);
    
    const { error } = await supabase
      .from('donation_settings')
      .update({
        current_amount: newAmount,
        goal_amount: newGoal,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .not('id', 'is', null); // Update all rows (there's only one)

    if (error) {
      toast.error("Failed to update donation settings");
      console.error(error);
    } else {
      setCurrentAmount(newAmount);
      setGoalAmount(newGoal);
      setShowEditModal(false);
      toast.success("Donation settings updated!");
    }
    
    setIsUpdating(false);
  };

  const canEdit = isOwner || isAdmin;

  return (
    <>
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
                Goal: ${goalAmount}
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

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleEditClick}
                className="h-9 w-9"
                title="Edit donation amount"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={handleDonateClick}
              className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
            >
              <Heart className="w-4 h-4" />
              Donate
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
              Donate via PayPal
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img 
                src={paypalQr} 
                alt="PayPal QR Code" 
                className="w-64 h-64 object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Scan this QR code with your phone's camera or PayPal app to donate
            </p>
            <p className="text-xs text-muted-foreground">
              Thank you for supporting Justachat™! ❤️
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Donation Modal (Admin Only) */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Update Donation Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Amount ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Amount ($)</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="500"
              />
            </div>
            <Button 
              onClick={handleUpdateDonation} 
              className="w-full"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DonationBanner;
