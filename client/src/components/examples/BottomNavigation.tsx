import { useState } from 'react';
import BottomNavigation from '../BottomNavigation';

export default function BottomNavigationExample() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="gradient-bg min-h-screen">
      <div className="pb-20 p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">মোবাইল নেভিগেশন</h1>
          <p className="text-muted-foreground">
            বর্তমান ট্যাব: <span className="font-semibold">{activeTab}</span>
          </p>
        </div>
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
