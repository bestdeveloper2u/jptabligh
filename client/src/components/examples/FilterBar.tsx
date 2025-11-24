import { useState } from 'react';
import FilterBar from '../FilterBar';

export default function FilterBarExample() {
  const [search, setSearch] = useState("");
  const [thana, setThana] = useState("all");
  const [union, setUnion] = useState("all");

  return (
    <div className="gradient-bg min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          thanaValue={thana}
          onThanaChange={setThana}
          unionValue={union}
          onUnionChange={setUnion}
        />
      </div>
    </div>
  );
}
