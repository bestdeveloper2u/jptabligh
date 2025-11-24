import HalqaCard from '../HalqaCard';

export default function HalqaCardExample() {
  const halqas = [
    {
      id: "1",
      name: "সদর হালকা - ১",
      thana: "জামালপুর সদর",
      union: "নরুন্দী",
      membersCount: 156,
      createdDate: "১৫ জানুয়ারি, ২০২৪",
    },
    {
      id: "2",
      name: "মেলান্দহ হালকা - ২",
      thana: "মেলান্দহ",
      union: "মেলান্দহ সদর",
      membersCount: 98,
      createdDate: "২০ ফেব্রুয়ারি, ২০২৪",
    },
  ];

  return (
    <div className="gradient-bg min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {halqas.map((halqa) => (
            <HalqaCard
              key={halqa.id}
              {...halqa}
              onView={() => console.log("View halqa:", halqa.id)}
              onEdit={() => console.log("Edit halqa:", halqa.id)}
              onDelete={() => console.log("Delete halqa:", halqa.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
