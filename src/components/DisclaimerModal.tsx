import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

interface DisclaimerModalProps {
  open: boolean;
  onAgree: () => void;
}

const DisclaimerModal = ({ open, onAgree }: DisclaimerModalProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (agreed) {
      localStorage.setItem("hasAgreedToDisclaimer", "true");
      onAgree();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            Important Disclaimer
          </DialogTitle>
          <DialogDescription className="pt-4">
            <div className="space-y-3 text-sm">
              <p>
                This app is made for <strong>informational purposes only</strong>. 
                The information provided here should not be used as a substitute for 
                professional medical advice, diagnosis, or treatment.
              </p>
              <p>
                Always seek the advice of your physician or other qualified health provider 
                with any questions you may have regarding a medical condition or medication. 
                Never disregard professional medical advice or delay in seeking it because 
                of something you have read in this app.
              </p>
              <p>
                <strong>Do not make final decisions</strong> about your health or medications 
                solely by referring to this app. Always consult a qualified healthcare professional 
                before starting, stopping, or changing any medication.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start space-x-2 py-4">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-1"
          />
          <label
            htmlFor="agree"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I understand and agree to the terms above. I acknowledge that this app is for 
            informational purposes only and I will consult a healthcare professional before 
            making any medical decisions.
          </label>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAgree}
            disabled={!agreed}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            I Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisclaimerModal;

