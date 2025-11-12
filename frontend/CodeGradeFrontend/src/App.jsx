import React, { useState, useEffect } from 'react';
import { Search, Github, Download, Star, GitBranch, FileCode, Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const App = () => {
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [repoInfo, setRepoInfo] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  const extractRepoInfo = (url) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
    return null;
  };

  const validateGithubUrl = (url) => {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/?.*$/;
    return githubRegex.test(url);
  };

  const analyzeRepository = async () => {
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!validateGithubUrl(githubUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)');
      return;
    }

    const info = extractRepoInfo(githubUrl);
    if (!info) {
      setError('Could not extract repository information from URL');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setRepoInfo(info);

    try {
      // First, validate that the repository exists
      const repoCheckResponse = await fetch(`https://api.github.com/repos/${info.owner}/${info.repo}`);
      if (!repoCheckResponse.ok) {
        if (repoCheckResponse.status === 404) {
          throw new Error('Repository not found. Please check the URL and ensure the repository is public.');
        }
        throw new Error(`Failed to access repository: ${repoCheckResponse.statusText}`);
      }

      // Construct the API URL for the repository contents
      const apiUrl = `https://api.github.com/repos/${info.owner}/${info.repo}/contents`;
      
      const response = await fetch('https://codegradeai.onrender.com/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: apiUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log('Analysis Data:', data.data);

      
      // Validate the response structure
      if (!data || data.data.output.overall_score=== undefined ) {
        throw new Error('Invalid response format from analysis service');
      }

      setResults(data.data.output);
      
      // Add to analysis history
      const analysisEntry = {
        url: githubUrl,
        repo: `${info.owner}/${info.repo}`,
        score: data.overall_score,
        timestamp: new Date().toISOString(),
        data: data
      };
      setAnalysisHistory(prev => [analysisEntry, ...prev.slice(0, 4)]); // Keep last 5 analyses
      
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please check the repository URL and try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const prepareRadarData = (ratings) => {
    return Object.entries(ratings).map(([key, value]) => ({
      metric: key.replace(/&/g, '&'),
      score: value,
      fullMark: 10
    }));
  };

  const prepareBarData = (ratings) => {
    return Object.entries(ratings).map(([key, value]) => ({
      name: key.split(' ').slice(0, 2).join(' '),
      score: value,
      color: value >= 8 ? '#10b981' : value >= 6 ? '#f59e0b' : '#ef4444'
    }));
  };

  const preparePieData = (ratings) => {
    const categories = {
      'Excellent (8-10)': 0,
      'Good (6-7)': 0,
      'Needs Improvement (0-5)': 0
    };

    Object.values(ratings).forEach(score => {
      if (score >= 8) categories['Excellent (8-10)']++;
      else if (score >= 6) categories['Good (6-7)']++;
      else categories['Needs Improvement (0-5)']++;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CodeGradeAI</h1>
                <p className="text-purple-300 text-sm">Intelligent Code Review Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-purple-300">
              <Github className="w-5 h-5" />
              <span className="text-sm">Powered by AI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Analyze Your Repository</h2>
            <p className="text-purple-300">Enter a GitHub repository URL to get detailed code quality insights</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Github className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && analyzeRepository()}
              />
            </div>
            <button
              onClick={analyzeRepository}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center text-red-300">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Analysis History */}
          {analysisHistory.length > 0 && !loading && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-3">Recent Analyses</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisHistory.map((analysis, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      setGithubUrl(analysis.url);
                      setResults(analysis.data);
                      setRepoInfo(extractRepoInfo(analysis.url));
                    }}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 text-sm font-medium truncate">{analysis.repo}</span>
                      <span className={`text-sm font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </span>
                    </div>
                    <div className="text-xs text-purple-400 mt-1">
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {loading && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analyzing Repository</h3>
              <p className="text-purple-300">This may take a few moments...</p>
              <div className="mt-4 max-w-md mx-auto bg-white/10 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileCode className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Ready to Analyze</h3>
            <p className="text-purple-300 max-w-md mx-auto">
              Enter a GitHub repository URL above to get started with intelligent code analysis and quality insights.
            </p>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-8">
            {/* Repository Info */}
            {repoInfo && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Github className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{repoInfo.owner}/{repoInfo.repo}</h3>
                      <p className="text-purple-300">Repository Analysis Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(results.overall_score)} ${getScoreColor(results.overall_score)}`}>
                      {results.basic_or_complex_logic || 'Standard'} Logic
                    </div>
                    <a 
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white/10 text-purple-300 rounded-full text-sm hover:bg-white/20 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <Github className="w-3 h-3" />
                      <span>View Repo</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Score Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                  <span className="text-3xl font-bold text-white">{results.overall_score}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Overall Score</h3>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {results.overall_score >= 8 ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : results.overall_score >= 6 ? (
                    <Clock className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <span className={`font-semibold ${getScoreColor(results.overall_score)}`}>
                    {results.overall_score >= 8 ? 'Excellent' : results.overall_score >= 6 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
                <p className="text-purple-300 max-w-2xl mx-auto">{results.summary || 'Analysis completed successfully.'}</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                  Performance Radar
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={prepareRadarData(results.ratings)}>
                      <PolarGrid stroke="#8b5cf6" strokeOpacity={0.3} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#c4b5fd', fontSize: 10 }} />
                      <PolarRadiusAxis 
                        angle={90}
                        domain={[0, 10]}
                        tick={{ fill: '#c4b5fd', fontSize: 8 }}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <BarChart className="w-5 h-5 mr-2 text-purple-400" />
                  Metric Scores
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareBarData(results.ratings)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf6" strokeOpacity={0.2} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#c4b5fd', fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#c4b5fd' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid #8b5cf6',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                  Score Distribution
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieData(results.ratings)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieData(results.ratings).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid #8b5cf6',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Detailed Metrics</h3>
                <div className="space-y-4">
                  {Object.entries(results.ratings).map(([metric, score]) => (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-purple-300 text-sm">{metric}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${(score / 10) * 100}%` }}
                          />
                        </div>
                        <span className={`font-semibold text-sm ${getScoreColor(score)}`}>
                          {score}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarks */}
            {results.remarks && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FileCode className="w-5 h-5 mr-2 text-purple-400" />
                  Analysis Remarks
                </h3>
                <p className="text-purple-200 leading-relaxed">{results.remarks}</p>
              </div>
            )}
            {results.suggestions && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FileCode className="w-5 h-5 mr-2 text-purple-400" />
                  suggestions
                </h3>
                <p className="text-purple-200 leading-relaxed">{results.suggestions}</p>
              </div>
            )}

            {/* Export Options */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Export Results</h3>
                  <p className="text-purple-300 text-sm">Download your analysis report</p>
                </div>
                <button 
                  onClick={() => {
                    const dataStr = JSON.stringify(results, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `code-analysis-${repoInfo?.repo || 'report'}.json`;
                    link.click();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;