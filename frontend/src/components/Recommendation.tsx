// src/components/Recommendation.tsx

import React from "react";

const Recommendation: React.FC = () => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Recommendation</h2>
      <p className="text-sm">
        We recommend exploring the concept "Cold" with ID 4224149 as the
        standard concept. Verify in Athena:
      </p>
      <a
        href="https://athena.ohdsi.org/search-terms/terms/4224149"
        className="text-primary hover:underline text-sm break-all"
        target="_blank"
        rel="noopener noreferrer"
      >
        https://athena.ohdsi.org/search-terms/terms/4224149
      </a>
    </div>
  );
};

export default Recommendation;
