// ButtonTest.tsx

import React from "react";
import { Button } from "@/components/ui/button";

const ButtonTest: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Shadcn UI Test</h1>
      <Button variant="default" onClick={() => alert("Button is working!")}>
        Test Button
      </Button>
      <Button variant="default">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="destructive">Destructive Button</Button>
    </div>
  );
};

export default ButtonTest;
