// Dashboard.tsx
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

// Define the MetricsData type
type MetricsData = {
  language_distribution: Record<string, number>;
  total_searches: number;
  search_trend: [string, number][];
  common_search_terms: Record<string, number>;
  concept_lookup_percentage: number;
  most_viewed_concepts: Record<string, number>;
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#87cefa"];

export default function Dashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch metrics data
    const fetchData = async () => {
      try {
        const response = await fetch("/api/metrics");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData?.detail || "Failed to retrieve metrics data",
          );
        }
        const data: MetricsData = await response.json();
        setMetricsData(data);
      } catch (error: any) {
        console.error("Error fetching metrics:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Replace Loader with a simple div or your own Loader component */}
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-red-500">Failed to load metrics data.</p>
      </div>
    );
  }

  // Prepare data for charts
  const languageData = Object.entries(metricsData.language_distribution).map(
    ([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    }),
  );

  const searchTrendData = metricsData.search_trend.map(
    ([date, count]: [string, number]) => ({
      date,
      count,
    }),
  );

  const wordcloudData = Object.entries(metricsData.common_search_terms).map(
    ([text, value]: [string, number]) => ({ text, value }),
  );

  const conceptData = Object.entries(metricsData.most_viewed_concepts)
    .map(([name, value]: [string, number]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-primary-foreground">
        Medical Search Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Searches */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Total Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-5xl font-bold text-primary">
              {metricsData.total_searches}
            </p>
          </CardContent>
        </Card>

        {/* Concept Lookup Percentage */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Concept Lookup Percentage
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <Progress
              value={metricsData.concept_lookup_percentage}
              className="w-full mb-2"
            />
            <p className="text-2xl font-medium text-primary">
              {metricsData.concept_lookup_percentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Language Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Trend */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Search Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={searchTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => format(new Date(tick), "MMM d")}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => format(new Date(label), "PPP")}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Viewed Concepts */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Most Viewed Concepts
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conceptData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Common Search Terms (Word Cloud) */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Common Search Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex flex-wrap justify-center items-center h-full overflow-auto">
            {wordcloudData.map(
              (word: { text: string; value: number }, index) => (
                <span
                  key={index}
                  className="m-1 p-1 rounded text-primary-foreground"
                  style={{
                    fontSize: `${Math.max(14, word.value * 1.5)}px`,
                    fontWeight: word.value > 10 ? "bold" : "normal",
                  }}
                >
                  {word.text}
                </span>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
