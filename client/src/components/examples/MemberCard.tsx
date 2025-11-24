import MemberCard from '../MemberCard';

export default function MemberCardExample() {
  const members = [
    {
      id: "1",
      name: "মোহাম্মদ আব্দুল্লাহ",
      phone: "০১৭১২৩৪৫৬৭৮",
      thana: "জামালপুর সদর",
      union: "নরুন্দী",
      mosque: "বাইতুল আমান মসজিদ",
      activities: ["tin-chilla", "ek-chilla", "sat-din"],
    },
    {
      id: "2",
      name: "আহমদ হাসান",
      phone: "০১৮১২৩৪৫৬৭৮",
      thana: "মেলান্দহ",
      union: "মেলান্দহ সদর",
      mosque: "কেন্দ্রীয় জামে মসজিদ",
      activities: ["ek-chilla", "tin-din"],
    },
  ];

  return (
    <div className="gradient-bg min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              {...member}
              onView={() => console.log("View member:", member.id)}
              onEdit={() => console.log("Edit member:", member.id)}
              onDelete={() => console.log("Delete member:", member.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
