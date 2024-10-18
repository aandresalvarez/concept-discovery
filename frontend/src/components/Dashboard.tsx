// src/components/Dashboard.tsx

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
import { useTranslation } from "react-i18next"; // Import useTranslation

// Define the MetricsData type
type MetricsData = {
  language_distribution: Record<string, number>;
  total_searches: number;
  search_trend: [string, number][];
  common_search_terms: Record<string, number>;
  concept_lookup_percentage: number;
  most_viewed_concepts: Record<string, number>;
  most_selected_synonyms: Record<string, number>;
};

// Define the SearchPath type
type SearchPath = {
  term: string;
  language: string;
  timestamp: string;
  selected_synonyms: string[];
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
  const { t, i18n } = useTranslation(["common"]); // Initialize translation
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [searchPaths, setSearchPaths] = useState<SearchPath[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/metrics");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `${t("serverError")}: ${response.status} ${errorText}`,
          );
        }
        const data: MetricsData = await response.json();
        setMetricsData({
          language_distribution: data.language_distribution || {},
          total_searches: data.total_searches || 0,
          search_trend: data.search_trend || [],
          common_search_terms: data.common_search_terms || {},
          concept_lookup_percentage: data.concept_lookup_percentage || 0,
          most_viewed_concepts: data.most_viewed_concepts || {},
          most_selected_synonyms: data.most_selected_synonyms || {},
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // Fetch search paths
  useEffect(() => {
    const fetchSearchPaths = async () => {
      try {
        const response = await fetch("/api/search_paths");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `${t("serverError")}: ${response.status} ${errorText}`,
          );
        }
        const data = await response.json();
        setSearchPaths(data.search_paths || []);
      } catch (error) {
        console.error("Error fetching search paths:", error);
      }
    };
    fetchSearchPaths();
  }, [t]);

  // Memoize computed data
  const languageData = useMemo(() => {
    return Object.entries(metricsData?.language_distribution || {}).map(
      ([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }),
    );
  }, [metricsData?.language_distribution]);

  const searchTrendData = useMemo(
    () =>
      metricsData?.search_trend.map(([date, count]) => ({
        date,
        count,
      })) || [],
    [metricsData?.search_trend],
  );

  const commonTermsData = useMemo(
    () =>
      Object.entries(metricsData?.common_search_terms || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [metricsData?.common_search_terms],
  );

  const synonymData = useMemo(
    () =>
      Object.entries(metricsData?.most_selected_synonyms || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [metricsData?.most_selected_synonyms],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Optionally add loading text */}
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="mt-2">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-destructive">
          {t("error")}: {error}
        </p>
      </div>
    );
  }

  if (!metricsData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-destructive">
          {t("failedToLoadMetricsData")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-primary">{t("dashboardTitle")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("totalSearches")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-5xl font-bold text-primary">
              {metricsData.total_searches.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("conceptLookupPercentage")}</CardTitle>
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
            <CardTitle>{t("languageDistribution")}</CardTitle>
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
            <CardTitle>{t("searchTrend")}</CardTitle>
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
            <CardTitle>{t("mostSelectedSynonyms")}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={synonymData} layout="vertical">
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
          <CardTitle>{t("commonSearchTerms")}</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>{t("searchPaths")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("timestamp")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("term")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("language")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("selectedSynonyms")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchPaths.map((path, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(path.timestamp).toLocaleString(i18n.language)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{path.term}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {path.language}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {path.selected_synonyms.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
