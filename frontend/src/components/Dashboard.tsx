import React, { useEffect, useState, useMemo } from "react";
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
import { Loader2 } from "lucide-react";

// Define the MetricsData type
type MetricsData = {
  language_distribution: Record<string, number>;
  total_searches: number;
  search_trend: [string, number][];
  common_search_terms: Record<string, number>;
  concept_lookup_percentage: number;
  most_viewed_concepts: Record<string, number>;
};

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#87cefa",
  "#8a2be2",
  "#a52a2a",
  "#deb887",
  "#5f9ea0",
  "#7fff00",
];

const Dashboard: React.FC = () => {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data with useEffect and handle errors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/metrics");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} ${errorText}`);
        }
        const data: MetricsData = await response.json();
        // Set default values if any data is missing
        setMetricsData({
          language_distribution: data.language_distribution || {},
          total_searches: data.total_searches || 0,
          search_trend: data.search_trend || [],
          common_search_terms: data.common_search_terms || {},
          concept_lookup_percentage: data.concept_lookup_percentage || 0,
          most_viewed_concepts: data.most_viewed_concepts || {},
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize computed data to prevent unnecessary recalculations
  const languageData = useMemo(() => {
    return Object.entries(metricsData?.language_distribution || {}).map(
      ([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      })
    );
  }, [metricsData?.language_distribution]);

  const searchTrendData = useMemo(
    () =>
      metricsData?.search_trend.map(([date, count]) => ({
        date,
        count,
      })) || [],
    [metricsData?.search_trend]
  );

  const commonTermsData = useMemo(
    () =>
      Object.entries(metricsData?.common_search_terms || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [metricsData?.common_search_terms]
  );

  const conceptData = useMemo(
    () =>
      Object.entries(metricsData?.most_viewed_concepts || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [metricsData?.most_viewed_concepts]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-destructive">Failed to load metrics data.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-primary">
        Medical Search Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Searches</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-5xl font-bold text-primary">
              {metricsData.total_searches.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Concept Lookup Percentage</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
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
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={searchTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
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

        <Card>
          <CardHeader>
            <CardTitle>Most Viewed Concepts</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conceptData} layout="vertical">
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

      <Card>
        <CardHeader>
          <CardTitle>Common Search Terms</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commonTermsData} layout="vertical">
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
  );
};

export default Dashboard;
