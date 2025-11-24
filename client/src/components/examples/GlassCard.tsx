import GlassCard from '../GlassCard';

export default function GlassCardExample() {
  return (
    <div className="gradient-bg min-h-screen p-6">
      <GlassCard>
        <h3 className="text-xl font-semibold mb-2">গ্লাসমরফিক কার্ড</h3>
        <p className="text-muted-foreground">এটি একটি সুন্দর স্বচ্ছ কার্ড যা ব্যাকগ্রাউন্ড ব্লার ইফেক্ট সহ।</p>
      </GlassCard>
    </div>
  );
}
