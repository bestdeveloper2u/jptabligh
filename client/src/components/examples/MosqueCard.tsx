import MosqueCard from '../MosqueCard';

export default function MosqueCardExample() {
  const mosques = [
    {
      id: "1",
      name: "বাইতুল আমান জামে মসজিদ",
      thana: "জামালপুর সদর",
      union: "নরুন্দী",
      address: "সদর রোড, জামালপুর",
      phone: "০১৭১২৩৪৫৬৭৮",
      membersCount: 45,
    },
    {
      id: "2",
      name: "কেন্দ্রীয় জামে মসজিদ",
      thana: "মেলান্দহ",
      union: "মেলান্দহ সদর",
      address: "মেলান্দহ বাজার",
      membersCount: 32,
    },
  ];

  return (
    <div className="gradient-bg min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {mosques.map((mosque) => (
            <MosqueCard
              key={mosque.id}
              {...mosque}
              onView={() => console.log("View mosque:", mosque.id)}
              onEdit={() => console.log("Edit mosque:", mosque.id)}
              onDelete={() => console.log("Delete mosque:", mosque.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
