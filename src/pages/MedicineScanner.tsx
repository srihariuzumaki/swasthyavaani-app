import MedicineScanner from "@/components/MedicineScanner";
import BottomNav from "@/components/BottomNav";

const MedicineScannerPage = () => {
  return (
    <div className="container max-w-md mx-auto pb-20 pt-4">
      <MedicineScanner />
      <BottomNav />
    </div>
  );
};

export default MedicineScannerPage;