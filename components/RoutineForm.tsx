"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type RoutineFormProps = {
  onSubmitAction: (data: any) => void;
  loading: boolean;
};

export default function RoutineForm({ onSubmitAction, loading }: RoutineFormProps) {
  const { data: session, status } = useSession();

  const [skinType, setSkinType] = useState("");
  const [score, setScore] = useState(50);
  const [climate, setClimate] = useState("");
  const [skinConcerns, setSkinConcerns] = useState<string[]>([]);
  const [steps, setSteps] = useState(5);
  const [times, setTimes] = useState(2);

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const concernOptions = ["Acne", "Aging", "Dark Spots", "Redness", "Dryness", "Oiliness"];

  // Fetch user profile data
  const fetchProfileData = async () => {
    if (!session?.user?.email) return;

    setLoadingProfile(true);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);

      const data = await res.json();
      const profile = data.profile || {};

      // Populate form with fetched data
      setSkinType(profile.skinType || "");
      setScore(profile.sensitivity ? Number(profile.sensitivity) : 50);
      setClimate(profile.location || "");
      setSkinConcerns(profile.concerns || []);
      setSteps(profile.routine?.length || 5);
      setTimes(profile.routine?.length ? 1 : 2); // default times if routine exists
    } catch (err) {
      console.error(err);
      setError("Failed to load profile data.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData();
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAction({ skinType, score, climate, skinConcerns, steps, times });
  };

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Please log in to fill your routine.</p>;
  }

  return (
    <Card className="border-pink-100 shadow-lg bg-white/90 backdrop-blur-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Generate Your Skincare Routine</CardTitle>
          <CardDescription>Fill in your skin profile to get a personalized routine</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {loadingProfile && <p className="text-xs text-gray-500">Loading profile...</p>}

          {/* Skin Type */}
          <div>
            <Label>Skin Type</Label>
            <RadioGroup value={skinType} onValueChange={setSkinType} className="grid grid-cols-2 gap-3 mt-2">
              {["Dry", "Oily", "Combination", "Normal", "Sensitive"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.toLowerCase()} id={type.toLowerCase()} />
                  <Label htmlFor={type.toLowerCase()}>{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Sensitivity Score */}
          <div>
            <Label>Sensitivity Score: {score}/100</Label>
            <Slider value={[score]} onValueChange={(val) => setScore(val[0])} max={100} step={1} />
          </div>

          {/* Climate */}
          <div>
            <Label>Climate</Label>
            <Input placeholder="e.g. Humid, Dry, Cold" value={climate} onChange={(e) => setClimate(e.target.value)} />
          </div>

          {/* Skin Concerns */}
          <div>
            <Label>Skin Concerns</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {concernOptions.map((c) => (
                <div key={c} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={c.toLowerCase()}
                    checked={skinConcerns.includes(c.toLowerCase())}
                    onChange={(e) => {
                      const newConcerns = e.target.checked
                        ? [...skinConcerns, c.toLowerCase()]
                        : skinConcerns.filter((x) => x !== c.toLowerCase());
                      setSkinConcerns(newConcerns);
                    }}
                  />
                  <Label htmlFor={c.toLowerCase()}>{c}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <Label>Number of Steps</Label>
            <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} />
          </div>

          {/* Times per day */}
          <div>
            <Label>Times per Day</Label>
            <Input type="number" value={times} onChange={(e) => setTimes(Number(e.target.value))} />
          </div>

          <Button type="submit" disabled={loading || loadingProfile} className="w-full bg-pink-100 hover:bg-pink-200 text-pink-700 mt-4">
            {loading ? "Generating..." : "Generate Routine"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
