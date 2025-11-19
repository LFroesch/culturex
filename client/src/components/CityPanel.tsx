import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface City {
  _id: string;
  name: string;
  country: string;
  contentCount: number;
}

interface CityPanelProps {
  city: City | null;
  onClose: () => void;
}

interface WikiSection {
  title: string;
  content: string;
}

// Component to parse and display Wikipedia content with accordion sections
const WikiContent = ({ wikiData }: { wikiData: any }) => {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0])); // First section open by default
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wikiData.fullHtml || !containerRef.current) return;

    // Parse HTML and fix relative links
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = wikiData.fullHtml;

    // Fix all relative links to point to Wikipedia
    const links = tempDiv.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        link.setAttribute('href', `https://en.wikipedia.org${href}`);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Update the container with fixed HTML
    if (containerRef.current) {
      containerRef.current.innerHTML = tempDiv.innerHTML;
    }
  }, [wikiData.fullHtml]);

  const toggleSection = (index: number) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const parseSections = (): WikiSection[] => {
    if (!wikiData.fullHtml) return [];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = wikiData.fullHtml;

    // Fix relative links first
    const links = tempDiv.querySelectorAll('a[href^="/"]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        link.setAttribute('href', `https://en.wikipedia.org${href}`);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    const sections: WikiSection[] = [];

    // Get all h2 elements from the entire document
    const allElements = Array.from(tempDiv.querySelectorAll('*'));
    const headingIndices: number[] = [];

    // Find all h2 heading positions
    allElements.forEach((el, idx) => {
      if (el.tagName === 'H2') {
        headingIndices.push(idx);
      }
    });

    // Filter out unwanted sections
    const skipSections = ['References', 'External links', 'See also', 'Notes', 'Further reading', 'Bibliography'];

    // If we have headings, create intro section with content before first heading
    if (headingIndices.length > 0) {
      const introElements = allElements.slice(0, headingIndices[0]);
      const introDiv = document.createElement('div');

      introElements.forEach(el => {
        if (el.textContent?.trim() &&
            !el.classList.contains('toc') &&
            el.tagName !== 'STYLE' &&
            el.tagName !== 'SCRIPT') {
          introDiv.appendChild(el.cloneNode(true));
        }
      });

      if (introDiv.innerHTML.trim()) {
        sections.push({
          title: 'Introduction',
          content: introDiv.innerHTML
        });
      }
    }

    // Process each section
    headingIndices.forEach((startIdx, i) => {
      const heading = allElements[startIdx] as HTMLElement;
      const title = heading.querySelector('.mw-headline')?.textContent ||
                    heading.textContent?.replace(/\[edit\]/g, '').trim() || '';

      // Skip unwanted sections
      if (skipSections.some(skip => title.toLowerCase().includes(skip.toLowerCase()))) {
        return;
      }

      const endIdx = headingIndices[i + 1] || allElements.length;
      const sectionElements = allElements.slice(startIdx + 1, endIdx);

      const contentDiv = document.createElement('div');
      sectionElements.forEach(el => {
        if (el.textContent?.trim() &&
            !el.classList.contains('mw-editsection') &&
            el.tagName !== 'H2' &&
            el.tagName !== 'STYLE' &&
            el.tagName !== 'SCRIPT') {
          contentDiv.appendChild(el.cloneNode(true));
        }
      });

      if (contentDiv.innerHTML.trim()) {
        sections.push({
          title: title,
          content: contentDiv.innerHTML
        });
      }
    });

    return sections;
  };

  const sections = parseSections();

  if (!wikiData.fullHtml) {
    return (
      <>
        {wikiData.thumbnail && (
          <img src={wikiData.thumbnail} alt={wikiData.title} className="w-full rounded mb-4" />
        )}
        <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-gray-100">{wikiData.title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{wikiData.extract}</p>
        {wikiData.url && (
          <a href={wikiData.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
            Read on Wikipedia →
          </a>
        )}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {wikiData.thumbnail && (
        <img src={wikiData.thumbnail} alt={wikiData.title} className="w-full rounded mb-4" />
      )}

      {sections.map((section, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(index)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center text-left transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{section.title}</h3>
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${openSections.has(index) ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.has(index) && (
            <div
              className="px-4 py-3 prose prose-sm max-w-none wiki-content dark:prose-invert bg-white dark:bg-gray-800"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
        </div>
      ))}

      {wikiData.url && (
        <a
          href={wikiData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block"
        >
          Read full article on Wikipedia →
        </a>
      )}

      <style>{`
        .wiki-content {
          color: #374151;
        }
        .dark .wiki-content {
          color: #d1d5db;
        }
        .wiki-content a {
          color: #3b82f6;
          text-decoration: none;
        }
        .dark .wiki-content a {
          color: #60a5fa;
        }
        .wiki-content a:hover {
          text-decoration: underline;
        }
        .wiki-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        .wiki-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          font-size: 0.875rem;
        }
        .wiki-content th,
        .wiki-content td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .dark .wiki-content th,
        .dark .wiki-content td {
          border-color: #4b5563;
        }
        .wiki-content th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .dark .wiki-content th {
          background-color: #374151;
        }
        .wiki-content .infobox {
          float: right;
          clear: right;
          width: 300px;
          margin: 0 0 1rem 1rem;
          border: 1px solid #e5e7eb;
          background-color: #f9fafb;
          font-size: 0.875rem;
        }
        .dark .wiki-content .infobox {
          border-color: #4b5563;
          background-color: #374151;
        }
        .wiki-content sup {
          font-size: 0.75rem;
        }
        .wiki-content .reference {
          color: #3b82f6;
          text-decoration: none;
        }
        .dark .wiki-content .reference {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};

const CityPanel = ({ city, onClose }: CityPanelProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('insight');
  const [posts, setPosts] = useState<any[]>([]);
  const [wikiData, setWikiData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (city) {
      // Reset to Local Insights tab when city changes
      setActiveTab('insight');
      // Clear old data when city changes
      setPosts([]);
      setWikiData(null);
      setVideos([]);
      setNews([]);
    }
  }, [city?._id]);

  useEffect(() => {
    if (city) {
      fetchTabContent(activeTab);
    }
  }, [city, activeTab]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && city) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [city, onClose]);

  const fetchTabContent = async (tab: string) => {
    if (!city) return;
    setLoading(true);

    try {
      switch (tab) {
        case 'news':
          const newsResponse = await api.get(`/external/news/${city._id}`);
          setNews(Array.isArray(newsResponse.data) ? newsResponse.data : []);
          break;
        case 'history':
          const wikiResponse = await api.get(`/external/wiki/${city._id}`);
          setWikiData(wikiResponse.data);
          break;
        case 'videos':
          const videoResponse = await api.get(`/external/youtube/${city._id}`);
          setVideos(Array.isArray(videoResponse.data) ? videoResponse.data : []);
          break;
        default:
          // User content tabs
          const postsResponse = await api.get(`/cities/${city._id}/posts?type=${tab}`);
          setPosts(postsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!city) return null;

  const tabs = [
    { id: 'news', label: 'News' },
    { id: 'history', label: 'History' },
    { id: 'videos', label: 'Videos' },
    { id: 'insight', label: 'Local Insights' },
    { id: 'photo', label: 'Photos' },
    { id: 'food', label: 'Food & Culture' },
    { id: 'recipe', label: 'Recipes' },
    { id: 'story', label: 'Stories' },
    { id: 'music', label: 'Music' },
    { id: 'workExchange', label: 'Work Exchange' },
    { id: 'forum', label: 'Forum' }
  ];

  return (
    <div className="fixed inset-y-0 right-0 top-16 w-full md:w-1/2 bg-white dark:bg-gray-800 shadow-2xl z-[1001] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{city.name}</h2>
            <p className="text-primary-100">{city.country}</p>
            <p className="text-sm text-primary-200 mt-1">{city.contentCount} posts</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-primary-200 text-2xl"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
        {/* Contribute Button */}
        <button
          onClick={() => navigate('/create-post')}
          className="w-full mb-4 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          + Contribute to {city.name}
        </button>

        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading...</div>
        ) : (
          <>
            {activeTab === 'news' && (
              <div className="space-y-4">
                {news.length > 0 ? (
                  news.map((article, idx) => (
                    <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      {article.urlToImage && (
                        <img src={article.urlToImage} alt={article.title} className="w-full h-48 object-cover rounded mb-2" />
                      )}
                      <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-gray-100">{article.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{article.description}</p>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 text-sm hover:underline">
                        Read more →
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-300">No news available</p>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {loading ? (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading...</div>
                ) : wikiData?.error ? (
                  <p className="text-gray-500 dark:text-gray-300">{wikiData.error}</p>
                ) : wikiData ? (
                  <WikiContent wikiData={wikiData} />
                ) : null}
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="space-y-4">
                {videos.length > 0 ? (
                  videos.map((video, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                      <img src={video.thumbnail} alt={video.title} className="w-full" />
                      <div className="p-3 bg-white dark:bg-gray-900">
                        <h4 className="font-bold mb-1 text-gray-900 dark:text-gray-100">{video.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{video.channelTitle}</p>
                        <a
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-2 inline-block"
                        >
                          Watch on YouTube →
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-300">No videos available</p>
                )}
              </div>
            )}

            {['insight', 'photo', 'food', 'recipe', 'story', 'music', 'workExchange', 'forum'].includes(activeTab) && (
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post._id} className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-900">
                      <h4 className="font-bold mb-2 text-gray-900 dark:text-gray-100">{post.title}</h4>
                      {post.description && <p className="text-gray-700 dark:text-gray-300 mb-2">{post.description}</p>}
                      {post.photos && post.photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {post.photos.map((photo: string, idx: number) => (
                            <img key={idx} src={photo} alt="" className="w-full h-32 object-cover rounded" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-300 mt-2">
                        <span>By {post.userId?.username || 'Unknown'}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-300">No content yet. Be the first to contribute!</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CityPanel;
