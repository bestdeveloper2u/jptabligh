import TopNavigation from '../TopNavigation';

export default function TopNavigationExample() {
  return (
    <div className="gradient-bg min-h-screen">
      <TopNavigation
        userName="মোহাম্মদ আব্দুল্লাহ"
        userRole="super_admin"
        onMenuClick={() => console.log("Menu clicked")}
        onLogout={() => console.log("Logout clicked")}
      />
      <div className="p-6">
        <h2 className="text-2xl font-bold">ড্যাশবোর্ড কন্টেন্ট</h2>
      </div>
    </div>
  );
}
