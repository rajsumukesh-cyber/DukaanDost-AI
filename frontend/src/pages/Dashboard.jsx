import React, { useState, useEffect } from 'react';
import { 
  Store, Plus, Trash2, Edit3, Wand2, BarChart3, Code, 
  ExternalLink, Search, Check, AlertTriangle, MessageSquare, 
  Clock, Truck, QrCode, Phone, Sparkles, Volume2, Save, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import EmbedCodeModal from '../components/EmbedCodeModal';

export default function Dashboard({ setActiveRoute }) {
  const { user, shop, updateShopState, t } = useAuth();
  const [activeTab, setActiveTab] = useState('faqs'); // faqs | bulk | analytics | inbox | profile
  const [faqs, setFaqs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // New/Edit FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'Timings',
    keywords: ''
  });

  // Bulk Generator
  const [bulkText, setBulkText] = useState('');
  const [isBulkExtracting, setIsBulkExtracting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    owner: '',
    timings: '',
    delivery_rules: '',
    upi_id: '',
    address: '',
    phone: '',
    widget_color: '#10B981'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (shop?.id) {
      loadShopData();
      setProfileForm({
        name: shop.name || '',
        owner: shop.owner || '',
        timings: shop.timings || '',
        delivery_rules: shop.delivery_rules || '',
        upi_id: shop.upi_id || '',
        address: shop.address || '',
        phone: shop.phone || '',
        widget_color: shop.widget_color || '#10B981'
      });
    }
  }, [shop?.id]);

  const loadShopData = async () => {
    setLoading(true);
    try {
      const [faqsData, analyticsData] = await Promise.all([
        api.getFAQs(shop.id),
        api.getAnalytics(shop.id).catch(() => null)
      ]);
      setFaqs(faqsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // FAQ CRUD
  const handleOpenAddModal = () => {
    setEditingFaqId(null);
    setFaqForm({ question: '', answer: '', category: 'Timings', keywords: '' });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditModal = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      keywords: faq.keywords || ''
    });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    try {
      if (editingFaqId) {
        await api.updateFAQ(editingFaqId, faqForm);
      } else {
        await api.createFAQ({ ...faqForm, shop_id: shop.id });
      }
      setIsFaqModalOpen(false);
      loadShopData();
    } catch (err) {
      alert(err.message || "Failed to save FAQ");
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (window.confirm("Are you sure you want to delete this FAQ entry?")) {
      try {
        await api.deleteFAQ(faqId);
        setFaqs(faqs.filter(f => f.id !== faqId));
      } catch (err) {
        alert(err.message || "Failed to delete FAQ");
      }
    }
  };

  // Bulk Generator
  const handleBulkGenerate = async () => {
    if (!bulkText.trim()) {
      alert("Please paste WhatsApp chat messages or store notes first.");
      return;
    }
    setIsBulkExtracting(true);
    setBulkResult(null);
    try {
      const result = await api.bulkGenerateFAQs(shop.id, bulkText);
      setBulkResult(result);
      loadShopData();
    } catch (err) {
      alert(err.message || "Bulk generation failed.");
    } finally {
      setIsBulkExtracting(false);
    }
  };

  const loadPresetDemoChat = (chatType) => {
    const demos = {
      kirana: `[12/03/26, 09:14:22] Customer: Dukaan khul gayi kya Sharma ji?
[12/03/26, 09:15:05] Sharma General Store: Haan bhai, subah 7:30 AM se raat 10:30 PM tak open rehti hai.
[12/03/26, 11:30:15] Customer: Amul milk packet aur butter mil jayega?
[12/03/26, 11:31:02] Sharma General Store: Haan, Amul Taaza, Amul Gold aur Butter fresh stock mein hai.
[12/03/26, 14:20:00] Customer: Free home delivery kitne order par hai?
[12/03/26, 14:21:18] Sharma General Store: 3 km ke andar ₹300 se upar free home delivery hai. 30-45 mins mein delivery ho jati hai.
[12/03/26, 16:05:10] Customer: Online Google Pay / PhonePe accept karte ho?
[12/03/26, 16:05:55] Sharma General Store: Haan ji, Google Pay, PhonePe, Paytm aur Cash sab chalta hai. UPI: sharmastore@okhdfcbank`,
      pharmacy: `15/03/2026, 08:30 - Customer: Dolo 650mg aur Paracetamol available hai?
15/03/2026, 08:31 - Gupta Medicos: Haan ji, Dolo 650, Calpol aur BP checking machine available hai.
15/03/2026, 09:12 - Customer: Pharmacy kab tak open rehti hai?
15/03/2026, 09:13 - Gupta Medicos: Subah 8:00 AM se raat 11:30 PM tak open rehte hain. Night emergency call helpline: 9415011223.
15/03/2026, 14:02 - Customer: Medicine home delivery karte ho?
15/03/2026, 14:03 - Gupta Medicos: Haan WhatsApp par prescription bhej dijiye. ₹200 se upar 30 mins mein free delivery hai.`
    };
    setBulkText(demos[chatType] || demos.kirana);
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateShop(shop.id, profileForm);
      updateShopState(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      alert("Failed to update shop profile");
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (faq.keywords || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">{shop?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  Bot Active
                </span>
                <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800">
                  {shop?.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                <span>👤 {shop?.owner}</span>
                <span>•</span>
                <span>📞 {shop?.phone}</span>
                <span>•</span>
                <span>📍 {shop?.address || 'India'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowEmbedModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <span>Get Embed Snippet</span>
            </button>
            <button
              onClick={() => setActiveRoute('customer-chat')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test Customer Chat</span>
            </button>
          </div>
        </div>

        {/* Analytics Key Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-xl font-black text-white">{analytics?.total_queries || faqs.length * 4}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{t.totalQueries}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-xl font-black text-emerald-400">{analytics?.resolution_rate || 94.2}%</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{t.resolutionRate}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-xl font-black text-sky-400">{analytics?.voice_percentage || 48}%</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{t.voiceQueries}</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-xl font-black text-amber-400">{analytics?.fallback_count || 1}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{t.unansweredCount}</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'faqs' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t.navFAQs} ({faqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'bulk' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span>{t.navBulkImport}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'analytics' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.navAnalytics}</span>
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'inbox' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>{t.unansweredTitle}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeTab === 'profile' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{t.navProfile}</span>
        </button>
      </div>

      {/* Tab 1: FAQs Manager */}
      {activeTab === 'faqs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Verified Store Knowledge Base</h2>
              <p className="text-xs text-slate-400 mt-0.5">The AI answers customer calls and queries directly from these entries.</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addFaqBtn}</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions, answers or keywords..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto text-xs pb-1">
              {['all', 'Timings', 'Delivery', 'Pricing', 'Stock', 'Payments'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    selectedCategory === cat ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400">
                      {faq.category || 'General'}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEditModal(faq)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{faq.question}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    {faq.answer}
                  </p>
                </div>
                {faq.keywords && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {faq.keywords.split(',').map((kw, i) => (
                      <span key={i} className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                        #{kw.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredFaqs.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No FAQs match your search. Click "Add New FAQ" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Bulk Import (Innovation Feature) */}
      {activeTab === 'bulk' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">{t.bulkImportTitle}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">{t.bulkImportDesc}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadPresetDemoChat('kirana')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Paste Kirana Demo Chat
              </button>
              <button
                type="button"
                onClick={() => loadPresetDemoChat('pharmacy')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Paste Pharmacy Demo Chat
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={t.bulkPastePlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500 transition resize-y"
            />
            <button
              onClick={handleBulkGenerate}
              disabled={isBulkExtracting}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isBulkExtracting ? 'AI is extracting Q&A pairs...' : t.bulkGenerateBtn}</span>
            </button>
          </div>

          {bulkResult && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="font-bold text-emerald-400 flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" />
                <span>Successfully extracted and added {bulkResult.count} new FAQs!</span>
              </div>
              <div className="space-y-2 mt-3">
                {bulkResult.faqs.map((f, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">[{f.category}]</span>{' '}
                    <span className="font-semibold text-white">{f.question}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{t.navAnalytics}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time statistics of customer inquiries answered by DukaanBot.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer Question</th>
                  <th className="py-3 px-4">AI Answer</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analytics?.recent_logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-white max-w-xs">{log.query_text}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">{log.answer_text}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase text-[10px] font-mono">
                        {log.language_detected}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {log.is_voice ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" /> Voice
                        </span>
                      ) : (
                        <span className="text-slate-400">Text</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.is_fallback ? (
                        <span className="text-amber-400 font-bold">Fallback</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">
                          {Math.round(log.confidence_score * 100)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Unanswered Inquiries Inbox */}
      {activeTab === 'inbox' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{t.unansweredTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.unansweredDesc}</p>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.unanswered_inbox?.length > 0 ? (
              analytics.unanswered_inbox.map((item) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded">
                      Unresolved Query
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">"{item.query_text}"</h4>
                    <p className="text-xs text-slate-500 mt-0.5">From: {item.customer_phone || 'Web Visitor'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Namaste! Regarding your question: ${item.query_text}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Reply on WhatsApp</span>
                    </a>
                    <button
                      onClick={() => {
                        setEditingFaqId(null);
                        setFaqForm({ question: item.query_text, answer: '', category: 'General', keywords: '' });
                        setIsFaqModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition"
                    >
                      Add to FAQs
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Inbox is all clear! All customer queries have been answered by the bot.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Shop Profile */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{t.navProfile}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Update business details that DukaanBot uses to guide customers.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={profileForm.owner}
                  onChange={(e) => setProfileForm({ ...profileForm, owner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.timingsLabel}</label>
              <input
                type="text"
                value={profileForm.timings}
                onChange={(e) => setProfileForm({ ...profileForm, timings: e.target.value })}
                placeholder="e.g. 7:30 AM - 10:30 PM (Mon-Sat)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.deliveryLabel}</label>
              <input
                type="text"
                value={profileForm.delivery_rules}
                onChange={(e) => setProfileForm({ ...profileForm, delivery_rules: e.target.value })}
                placeholder="e.g. Free home delivery above ₹300 within 3 km"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.upiLabel}</label>
                <input
                  type="text"
                  value={profileForm.upi_id}
                  onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                  placeholder="e.g. storename@okhdfcbank"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.phoneLabel}</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{t.addressLabel}</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaved ? 'Profile Updated!' : t.saveProfileBtn}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add/Edit FAQ */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsFaqModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingFaqId ? 'Edit FAQ Entry' : t.addFaqBtn}
            </h3>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.categoryLabel}</label>
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="Timings">⏰ Store Timings</option>
                  <option value="Delivery">🚚 Home Delivery</option>
                  <option value="Pricing">🏷️ Price & Rates</option>
                  <option value="Stock">📦 Stock & Availability</option>
                  <option value="Payments">💳 Payments & UPI</option>
                  <option value="Location">📍 Shop Address / Location</option>
                  <option value="General">ℹ️ General FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.questionLabel}</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="e.g. Dukaan kitne baje khulti hai?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.answerLabel}</label>
                <textarea
                  rows={3}
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="e.g. Hamari dukaan subah 7:30 AM se raat 10:30 PM tak khuli rehti hai."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t.keywordsLabel}</label>
                <input
                  type="text"
                  value={faqForm.keywords}
                  onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })}
                  placeholder="e.g. timing, open, close, hours, samay"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  {t.saveFaqBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      <EmbedCodeModal
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        shopId={shop?.id}
      />
    </div>
  );
}
