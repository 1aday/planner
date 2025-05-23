"use client";

import Image from "next/image";
import { Download, Plus, Minus } from "lucide-react";
import { useState, useRef } from "react";
import { Playfair_Display, Montserrat } from 'next/font/google';

// Load the fonts
const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-playfair',
});

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-montserrat',
});

// Custom CSS styles
const noScrollbarStyles = {
  '-webkit-scrollbar': 'none',
  '-ms-overflow-style': 'none',
  'scrollbar-width': 'none'
};

// Interface for a workshop item
interface Workshop {
  day: string;
  dayNumber: string;
  time: string;
  title: string;
}

export default function Home() {
  // State for all workshops, organized by day
  const [workshops, setWorkshops] = useState<Record<string, Workshop[]>>({});
  // State for the input CSV text
  const [csvInput, setCsvInput] = useState("");
  // State to track available days
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  // State to track which days are in which column
  const [columnDays, setColumnDays] = useState<{left: string[], right: string[]}>({left: [], right: []});
  // Ref for the schedule container to use for image export
  const scheduleRef = useRef<HTMLDivElement>(null);
  // State for download status
  const [downloadStatus, setDownloadStatus] = useState<string>("");
  // State for input collapse
  const [inputCollapsed, setInputCollapsed] = useState(false);
  
  // States for display settings
  const [headerFontSize, setHeaderFontSize] = useState<"text-lg" | "text-xl" | "text-2xl" | "text-3xl">("text-3xl");
  const [titleFontSize, setTitleFontSize] = useState<"text-xs" | "text-sm" | "text-base" | "text-lg">("text-lg");
  const [timeFontSize, setTimeFontSize] = useState<"text-[10px]" | "text-xs" | "text-sm" | "text-base">("text-base");
  const [itemSpacing, setItemSpacing] = useState<"gap-0.5" | "gap-1" | "gap-2">("gap-2");
  const [sectionSpacing, setSectionSpacing] = useState<"mb-2" | "mb-3" | "mb-4">("mb-4");
  const [itemPadding, setItemPadding] = useState<"py-0.5 px-1" | "py-1 px-2" | "py-1.5 px-2.5">("py-1.5 px-2.5");
  const [topPadding, setTopPadding] = useState<"pt-2" | "pt-4" | "pt-6">("pt-2");
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  
  // Font weight states
  const [headerWeight, setHeaderWeight] = useState<"font-normal" | "font-medium" | "font-semibold" | "font-bold">("font-bold");
  const [titleWeight, setTitleWeight] = useState<"font-normal" | "font-medium" | "font-semibold" | "font-bold">("font-bold");
  const [timeWeight, setTimeWeight] = useState<"font-normal" | "font-medium" | "font-semibold" | "font-bold">("font-semibold");
  
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string>('/backgorund.webp');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Add a state for logo placement
  const [logoPosition, setLogoPosition] = useState<"bottom-right" | "top-left" | "top-right" | "bottom-left" | "none">("bottom-right");

  // First, add a new state variable for title padding near the other state variables
  const [titlePadding, setTitlePadding] = useState<"py-1 px-2" | "py-2 px-3" | "py-3 px-3">("py-2 px-3");

  // Function to distribute days between two columns
  // Try to balance by number of workshops
  const distributeDays = (days: string[], workshopsData: Record<string, Workshop[]>) => {
    if (days.length === 0) {
      return { left: [], right: [] };
    }
    
    if (days.length === 1) {
      return { left: days, right: [] };
    }
    
    if (days.length === 2) {
      return { left: [days[0]], right: [days[1]] };
    }
    
    // For 3+ days, distribute based on workshop count
    const daysWithCounts = days.map(day => ({
      day,
      count: workshopsData[day]?.length || 0
    }));
    
    // Sort by workshop count (descending)
    daysWithCounts.sort((a, b) => b.count - a.count);
    
    // Initialize columns
    const left: string[] = [];
    const right: string[] = [];
    let leftCount = 0;
    let rightCount = 0;
    
    // Distribute days to balance workshop counts
    daysWithCounts.forEach(({ day, count }) => {
      if (leftCount <= rightCount) {
        left.push(day);
        leftCount += count;
      } else {
        right.push(day);
        rightCount += count;
      }
    });
    
    return { left, right };
  };

  // Function to parse CSV data
  const parseCSV = () => {
    if (!csvInput.trim()) return;

    const lines = csvInput.trim().split('\n');
    const parsedWorkshops: Record<string, Workshop[]> = {};
    
    let currentDay: string | null = null;
    let currentDayNumber: string | null = null;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty lines
      
      // Try to match the original format: "1 Perşembe\t13.00-15.00 Örgünü Al Gel Atölyesi"
      const tabMatch = trimmedLine.match(/^(\d+)\s+([^\t]+)\t([\d\.\-]+)\s+(.+)$/);
      
      // Try to match day-only format: "1 Perşembe"
      const dayMatch = trimmedLine.match(/^(\d+)\s+([^0-9]+)$/);
      
      // Try to match workshop-only format: "13.00-15.00 Örgünü Al Gel Atölyesi"
      const workshopMatch = trimmedLine.match(/^([\d\.\-]+)\s+(.+)$/);
      
      if (tabMatch) {
        // Original format with tab separator
        const [, dayNumber, day, time, title] = tabMatch;
        const dayKey = `${dayNumber} ${day}`;
        
        if (!parsedWorkshops[dayKey]) {
          parsedWorkshops[dayKey] = [];
        }
        
        parsedWorkshops[dayKey].push({
          day,
          dayNumber,
          time,
          title
        });
        
        // Update current day in case the next lines are workshop-only format
        currentDay = day;
        currentDayNumber = dayNumber;
      } 
      else if (dayMatch) {
        // Day-only line
        const [, dayNumber, day] = dayMatch;
        const dayKey = `${dayNumber} ${day}`;
        
        if (!parsedWorkshops[dayKey]) {
          parsedWorkshops[dayKey] = [];
        }
        
        // Update current day for subsequent workshop entries
        currentDay = day;
        currentDayNumber = dayNumber;
      } 
      else if (workshopMatch && currentDay && currentDayNumber) {
        // Workshop-only line, use the current day
        const [, time, title] = workshopMatch;
        const dayKey = `${currentDayNumber} ${currentDay}`;
        
        parsedWorkshops[dayKey].push({
          day: currentDay,
          dayNumber: currentDayNumber,
          time,
          title
        });
      }
    });
    
    // Update workshops state
    setWorkshops(parsedWorkshops);
    
    // Update available days
    const days = Object.keys(parsedWorkshops);
    setAvailableDays(days);
    
    // Distribute days between columns
    setColumnDays(distributeDays(days, parsedWorkshops));
    
    // After generating schedule, collapse the input
    setInputCollapsed(true);
    // Show display settings automatically
    setShowDisplaySettings(true);
  };

  // Sample CSV data for two days (tab-separated format)
  const sampleTwoDays = `1 Perşembe\t13.00-15.00 Örgünü Al Gel Atölyesi (ÜCRETSİZ)
1 Perşembe\t15.00-17.00 Polimer Kil Kupa Tasarım Atölyesi
1 Perşembe\t15.00-17.00 Murano Cam Boncuk Yapım Atölyesi
1 Perşembe\t19.00-21.00 Cupcake Mum Atölyesi
1 Perşembe\t19.00-21.00 Resim Atölyesi
2 Cuma\t13.00-15.00 Mumdan Çiçek Buketi Yapım Atölyesi
2 Cuma\t15.00-17.00 Punch Nakış Atölyesi
2 Cuma\t19.00-21.00 Cupcake Mum Atölyesi
2 Cuma\t19.00-21.00 Seramik Atölyesi
2 Cuma\t19.00-21.00 Bento Pasta Atölyesi`;

  // Sample CSV data for three days (tab-separated format)
  const sampleThreeDays = `1 Perşembe\t13.00-15.00 Örgünü Al Gel Atölyesi (ÜCRETSİZ)
1 Perşembe\t15.00-17.00 Polimer Kil Kupa Tasarım Atölyesi
1 Perşembe\t15.00-17.00 Murano Cam Boncuk Yapım Atölyesi
1 Perşembe\t19.00-21.00 Cupcake Mum Atölyesi
1 Perşembe\t19.00-21.00 Resim Atölyesi
2 Cuma\t13.00-15.00 Mumdan Çiçek Buketi Yapım Atölyesi
2 Cuma\t15.00-17.00 Punch Nakış Atölyesi
2 Cuma\t19.00-21.00 Cupcake Mum Atölyesi
3 Cumartesi\t13.00-15.00 Seramik Atölyesi
3 Cumartesi\t15.00-17.00 Candle Making Workshop`;

  // Sample data with day-per-line format
  const sampleDayPerLine = `1 Perşembe
13.00-15.00 Örgünü Al Gel Atölyesi (ÜCRETSİZ)
15.00-17.00 Polimer Kil Kupa Tasarım Atölyesi
15.00-17.00 Murano Cam Boncuk Yapım Atölyesi
19.00-21.00 Cupcake Mum Atölyesi
19.00-21.00 Resim Atölyesi

2 Cuma
13.00-15.00 Mumdan Çiçek Buketi Yapım Atölyesi
15.00-17.00 Punch Nakış Atölyesi
19.00-21.00 Cupcake Mum Atölyesi
19.00-21.00 Seramik Atölyesi
19.00-21.00 Bento Pasta Atölyesi`;

  // Helper function to get day name in proper format
  const formatDayName = (dayKey: string) => {
    // Return the full day key (like "1 Perşembe" or "2 Cuma")
    return dayKey;
  };

  // Function to download schedule as PNG
  const downloadScheduleAsPNG = async () => {
    if (!scheduleRef.current || availableDays.length === 0) return;
    
    try {
      setDownloadStatus("downloading");
      
      // Dynamically import html-to-image
      const htmlToImage = await import('html-to-image');
      
      // Short delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toPng(scheduleRef.current, {
        quality: 0.95,
        backgroundColor: '#FDF2E7',
        pixelRatio: 2, // Higher resolution
        skipFonts: true, // Skip font embedding to avoid CORS issues
        fontEmbedCSS: '', // Empty font CSS
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      });
      
      // Generate filename based on the days in the schedule
      let filename = 'workshop-schedule';
      if (availableDays.length > 0) {
        // Add date info to filename
        const firstDay = availableDays[0].split(' ')[0];
        const lastDay = availableDays[availableDays.length - 1].split(' ')[0];
        
        if (availableDays.length === 1) {
          filename = `workshop-day-${firstDay}`;
        } else {
          filename = `workshop-days-${firstDay}-to-${lastDay}`;
        }
      }
      
      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
      
      setDownloadStatus("success");
      setTimeout(() => setDownloadStatus(""), 2000);
    } catch (error) {
      console.error('Error generating image:', error);
      setDownloadStatus("error");
      setTimeout(() => setDownloadStatus(""), 2000);
    }
  };

  // Function to increase both title and time font sizes together
  const increaseBothFontSizes = () => {
    setTitleFontSize(current => {
      if (current === "text-xs") return "text-sm";
      if (current === "text-sm") return "text-base";
      if (current === "text-base") return "text-lg";
      return "text-lg";
    });
    
    setTimeFontSize(current => {
      if (current === "text-[10px]") return "text-xs";
      if (current === "text-xs") return "text-sm";
      if (current === "text-sm") return "text-base";
      return "text-base";
    });
  };
  
  // Function to decrease both title and time font sizes together
  const decreaseBothFontSizes = () => {
    setTitleFontSize(current => {
      if (current === "text-lg") return "text-base";
      if (current === "text-base") return "text-sm";
      if (current === "text-sm") return "text-xs";
      return "text-xs";
    });
    
    setTimeFontSize(current => {
      if (current === "text-base") return "text-sm";
      if (current === "text-sm") return "text-xs";
      if (current === "text-xs") return "text-[10px]";
      return "text-[10px]";
    });
  };
  
  // Helper function to get current font size level
  const getBothFontSizesLevel = (): string => {
    if (titleFontSize === "text-xs" || timeFontSize === "text-[10px]") {
      return "Small";
    } else if (titleFontSize === "text-sm" || timeFontSize === "text-xs") {
      return "Medium";
    } else if (titleFontSize === "text-base" || timeFontSize === "text-sm") {
      return "Large";
    } else {
      return "Extra Large";
    }
  };

  // Function to handle background image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setUploadingImage(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBackgroundImage(e.target.result as string);
        setUploadingImage(false);
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Function to reset background to default
  const resetBackground = () => {
    setBackgroundImage('/backgorund.webp');
  };

  // Update the bento grid styles to hide scrollbars
  const bentoGridStyle = {
    columnCount: 2,
    columnGap: '1.5rem',
    padding: '0.5rem',
    maxHeight: '100%',
    overflow: 'hidden',
    width: '100%',
  };

  return (
    <div className={`flex flex-col justify-center items-center min-h-screen w-full bg-[#FFF5F5] p-4 ${montserrat.variable}`}>
      {/* Logo Header */}
      <div className="w-full flex justify-center mb-6">
        <Image
          src="/logo-2.png" 
          alt="Atölye Jeane Logo" 
          width={150} 
          height={60} 
          className="h-auto"
          priority
        />
      </div>
      
      <div className="flex flex-col lg:flex-row max-w-6xl w-full gap-6">
        {/* Left side - CSV Input area */}
        <div className="lg:flex-1 bg-white/90 rounded-xl shadow-lg flex flex-col overflow-hidden border border-[#FFE0E0]">
          <div className="bg-[#FFE0E0] p-2 text-center text-[#3A3A3A]">
            <h2 className="text-xl font-semibold tracking-tight">Import Workshop Schedule</h2>
          </div>
          <div className="flex-grow p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {/* CSV Input Section with Collapsible Logic */}
              <div className="flex justify-between items-center">
                <label htmlFor="csvInput" className="text-sm font-medium text-[#3A3A3A]">
                  Paste CSV Data (Format: &quot;Day# DayName[tab]Time Title&quot;)
                </label>
                {inputCollapsed && availableDays.length > 0 && (
                  <button 
                    className="text-xs text-[#FF9090] hover:underline"
                    onClick={() => setInputCollapsed(false)}
                  >
                    Edit Input
                  </button>
                )}
              </div>
              
              {!inputCollapsed && (
                <>
                  <div className="flex gap-2 items-center">
                    <button
                      className="text-xs text-[#FF9090] hover:underline"
                      onClick={() => setCsvInput(sampleTwoDays)}
                    >
                      2 Days Example
                    </button>
                    <button
                      className="text-xs text-[#FF9090] hover:underline"
                      onClick={() => setCsvInput(sampleThreeDays)}
                    >
                      3 Days Example
                    </button>
                    <button
                      className="text-xs text-[#FF9090] hover:underline"
                      onClick={() => setCsvInput(sampleDayPerLine)}
                    >
                      Day-Per-Line Format
                    </button>
                    <button
                      className="text-xs text-[#FF9090] hover:underline"
                      onClick={() => setCsvInput("")}
                    >
                      Clear
                    </button>
                  </div>
                  <textarea 
                    id="csvInput" 
                    className="p-2 border border-[#FFE0E0] rounded-md h-64 resize-none focus:outline-none focus:ring-1 focus:ring-[#FFD0D0] font-mono text-sm"
                    placeholder="Paste your workshop schedule data here..."
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                  ></textarea>
                </>
              )}
              
              {inputCollapsed && csvInput && (
                <div className="bg-gray-50 border border-[#FFE0E0] rounded-md p-2 text-sm font-mono line-clamp-3 text-gray-600 cursor-pointer" onClick={() => setInputCollapsed(false)}>
                  {csvInput.split('\n').slice(0, 3).join('\n')}
                  {csvInput.split('\n').length > 3 && '...'}
                </div>
              )}
            </div>
            
            {!inputCollapsed && (
              <button 
                className="mt-2 bg-[#FFD0D0] text-[#3A3A3A] py-2 px-4 rounded-md hover:bg-[#FFC0C0] transition-colors font-medium"
                onClick={parseCSV}
                disabled={!csvInput.trim()}
              >
                Generate Schedule
              </button>
            )}
            
            {availableDays.length > 0 && (
              <div className="space-y-4">
                {/* Display Settings Section - Always visible once schedule is generated */}
                {inputCollapsed && (
                  <div className="border-t border-[#FFE0E0] pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-[#3A3A3A]">Display Settings</h3>
                      <button
                        className="text-xs text-[#FF9090] hover:underline"
                        onClick={() => setShowDisplaySettings(!showDisplaySettings)}
                      >
                        {showDisplaySettings ? "Hide" : "Show"}
                      </button>
                    </div>
                    
                    {showDisplaySettings && (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1 border-b border-[#FFE0E0] pb-2 mb-1">
                          <label className="text-xs text-[#FF9090] font-medium">All Workshop Text Size</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                              onClick={decreaseBothFontSizes}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#FFE0E0] flex-1 text-center text-sm">
                              {getBothFontSizesLevel()}
                            </div>
                            <button
                              className="p-1 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                              onClick={increaseBothFontSizes}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Top Padding Control */}
                        <div className="flex flex-col gap-1 border-b border-[#FFE0E0] pb-2 mb-1">
                          <label className="text-xs text-[#FF9090] font-medium">Top Padding</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                              onClick={() => setTopPadding(current => 
                                current === "pt-2" ? "pt-2" : 
                                current === "pt-4" ? "pt-2" : "pt-4"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#FFE0E0] flex-1 text-center text-sm">
                              {topPadding === "pt-2" ? "Small" : 
                               topPadding === "pt-4" ? "Medium" : "Large"}
                            </div>
                            <button
                              className="p-1 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                              onClick={() => setTopPadding(current => 
                                current === "pt-2" ? "pt-4" : 
                                current === "pt-4" ? "pt-6" : "pt-6"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Background Image Upload */}
                        <div className="flex flex-col gap-1 border-b border-[#FFE0E0] pb-2 mb-1">
                          <label className="text-xs text-[#FF9090] font-medium">Background Image</label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                disabled={uploadingImage}
                              />
                              <div className="w-full py-1 px-2 text-xs border border-[#FFE0E0] rounded-md bg-white text-[#3A3A3A] flex justify-center items-center">
                                {uploadingImage ? 'Uploading...' : 'Upload Custom Image'}
                              </div>
                            </div>
                            <button
                              className="py-1 px-2 text-xs border border-[#FFE0E0] rounded-md bg-[#FFF5F5] text-[#FF9090] hover:bg-[#FFE0E0]"
                              onClick={resetBackground}
                              disabled={backgroundImage === '/backgorund.webp'}
                            >
                              Reset
                            </button>
                          </div>
                          <div className="text-[10px] text-[#FF9090] mt-0.5">
                            Recommended size: 1080×675px, max 5MB
                          </div>
                        </div>

                        {/* Logo Position Control */}
                        <div className="flex flex-col gap-1 border-b border-[#FFE0E0] pb-2 mb-1">
                          <label className="text-xs text-[#FF9090] font-medium">Logo Position</label>
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <button 
                              className={`p-1 border rounded ${logoPosition === "top-left" ? "bg-[#FFD0D0] border-[#FF9090]" : "bg-white border-[#FFE0E0]"}`}
                              onClick={() => setLogoPosition("top-left")}
                            >
                              Top Left
                            </button>
                            <button 
                              className={`p-1 border rounded ${logoPosition === "top-right" ? "bg-[#FFD0D0] border-[#FF9090]" : "bg-white border-[#FFE0E0]"}`}
                              onClick={() => setLogoPosition("top-right")}
                            >
                              Top Right
                            </button>
                            <button 
                              className={`p-1 border rounded ${logoPosition === "none" ? "bg-[#FFD0D0] border-[#FF9090]" : "bg-white border-[#FFE0E0]"}`}
                              onClick={() => setLogoPosition("none")}
                            >
                              None
                            </button>
                            <button 
                              className={`p-1 border rounded ${logoPosition === "bottom-left" ? "bg-[#FFD0D0] border-[#FF9090]" : "bg-white border-[#FFE0E0]"}`}
                              onClick={() => setLogoPosition("bottom-left")}
                            >
                              Bottom Left
                            </button>
                            <button 
                              className={`p-1 border rounded ${logoPosition === "bottom-right" ? "bg-[#FFD0D0] border-[#FF9090]" : "bg-white border-[#FFE0E0]"}`}
                              onClick={() => setLogoPosition("bottom-right")}
                            >
                              Bottom Right
                            </button>
                          </div>
                        </div>

                        {/* Two column grid for controls */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                          {/* Day Header Font Size */}
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] text-[#FF9090]">Day Header Size</label>
                            <div className="flex items-center">
                              <button
                                className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                onClick={() => setHeaderFontSize(current => 
                                  current === "text-lg" ? "text-lg" : 
                                  current === "text-xl" ? "text-lg" : 
                                  current === "text-2xl" ? "text-xl" : "text-2xl"
                                )}
                              >
                                <Minus size={12} />
                              </button>
                              <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                {headerFontSize === "text-lg" ? "Small" : 
                                 headerFontSize === "text-xl" ? "Medium" : 
                                 headerFontSize === "text-2xl" ? "Large" : "Extra Large"}
                              </div>
                              <button
                                className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                onClick={() => setHeaderFontSize(current => 
                                  current === "text-lg" ? "text-xl" : 
                                  current === "text-xl" ? "text-2xl" : 
                                  current === "text-2xl" ? "text-3xl" : "text-3xl"
                                )}
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Day Header Font Weight */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Day Header Weight</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setHeaderWeight(current => 
                                    current === "font-normal" ? "font-normal" : 
                                    current === "font-medium" ? "font-normal" : 
                                    current === "font-semibold" ? "font-medium" : "font-semibold"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {headerWeight === "font-normal" ? "Normal" : 
                                   headerWeight === "font-medium" ? "Medium" : 
                                   headerWeight === "font-semibold" ? "Semibold" : "Bold"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setHeaderWeight(current => 
                                    current === "font-normal" ? "font-medium" : 
                                    current === "font-medium" ? "font-semibold" : 
                                    current === "font-semibold" ? "font-bold" : "font-bold"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Title Font Size */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Title Size</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTitleFontSize(current => 
                                    current === "text-xs" ? "text-xs" : 
                                    current === "text-sm" ? "text-xs" : 
                                    current === "text-base" ? "text-sm" : "text-base"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {titleFontSize === "text-xs" ? "Small" : 
                                   titleFontSize === "text-sm" ? "Medium" : 
                                   titleFontSize === "text-base" ? "Large" : "Extra Large"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTitleFontSize(current => 
                                    current === "text-xs" ? "text-sm" : 
                                    current === "text-sm" ? "text-base" : 
                                    current === "text-base" ? "text-lg" : "text-lg"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Title Weight */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Title Weight</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTitleWeight(current => 
                                    current === "font-normal" ? "font-normal" : 
                                    current === "font-medium" ? "font-normal" : 
                                    current === "font-semibold" ? "font-medium" : "font-semibold"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {titleWeight === "font-normal" ? "Normal" : 
                                   titleWeight === "font-medium" ? "Medium" : 
                                   titleWeight === "font-semibold" ? "Semibold" : "Bold"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTitleWeight(current => 
                                    current === "font-normal" ? "font-medium" : 
                                    current === "font-medium" ? "font-semibold" : 
                                    current === "font-semibold" ? "font-bold" : "font-bold"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Time Font Size */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Time Size</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTimeFontSize(current => 
                                    current === "text-[10px]" ? "text-[10px]" : 
                                    current === "text-xs" ? "text-[10px]" : 
                                    current === "text-sm" ? "text-xs" : "text-sm"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {timeFontSize === "text-[10px]" ? "Small" : 
                                   timeFontSize === "text-xs" ? "Medium" : 
                                   timeFontSize === "text-sm" ? "Large" : "Extra Large"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTimeFontSize(current => 
                                    current === "text-[10px]" ? "text-xs" : 
                                    current === "text-xs" ? "text-sm" : 
                                    current === "text-sm" ? "text-base" : "text-base"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Time Weight */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Time Weight</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTimeWeight(current => 
                                    current === "font-normal" ? "font-normal" : 
                                    current === "font-medium" ? "font-normal" : 
                                    current === "font-semibold" ? "font-medium" : "font-semibold"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {timeWeight === "font-normal" ? "Normal" : 
                                   timeWeight === "font-medium" ? "Medium" : 
                                   timeWeight === "font-semibold" ? "Semibold" : "Bold"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTimeWeight(current => 
                                    current === "font-normal" ? "font-medium" : 
                                    current === "font-medium" ? "font-semibold" : 
                                    current === "font-semibold" ? "font-bold" : "font-bold"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Item Spacing */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Item Spacing</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setItemSpacing(current => 
                                    current === "gap-0.5" ? "gap-0.5" : 
                                    current === "gap-1" ? "gap-0.5" : "gap-1"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {itemSpacing === "gap-0.5" ? "Compact" : 
                                   itemSpacing === "gap-1" ? "Normal" : "Spacious"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setItemSpacing(current => 
                                    current === "gap-0.5" ? "gap-1" : 
                                    current === "gap-1" ? "gap-2" : "gap-2"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Item Padding */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Item Padding</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setItemPadding(current => 
                                    current === "py-0.5 px-1" ? "py-0.5 px-1" : 
                                    current === "py-1 px-2" ? "py-0.5 px-1" : "py-1 px-2"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {itemPadding === "py-0.5 px-1" ? "Compact" : 
                                   itemPadding === "py-1 px-2" ? "Normal" : "Spacious"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setItemPadding(current => 
                                    current === "py-0.5 px-1" ? "py-1 px-2" : 
                                    current === "py-1 px-2" ? "py-1.5 px-2.5" : "py-1.5 px-2.5"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Section Spacing */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Section Spacing</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setSectionSpacing(current => 
                                    current === "mb-2" ? "mb-2" : 
                                    current === "mb-3" ? "mb-2" : "mb-3"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {sectionSpacing === "mb-2" ? "Compact" : 
                                   sectionSpacing === "mb-3" ? "Normal" : "Spacious"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setSectionSpacing(current => 
                                    current === "mb-2" ? "mb-3" : 
                                    current === "mb-3" ? "mb-4" : "mb-4"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Title Area Padding */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] text-[#FF9090]">Title Area Padding</label>
                              <div className="flex items-center">
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-l-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTitlePadding(current => 
                                    current === "py-1 px-2" ? "py-1 px-2" : 
                                    current === "py-2 px-3" ? "py-1 px-2" : "py-2 px-3"
                                  )}
                                >
                                  <Minus size={12} />
                                </button>
                                <div className="px-1 bg-white border-y border-[#FFE0E0] flex-1 text-center text-xs">
                                  {titlePadding === "py-1 px-2" ? "Compact" : 
                                   titlePadding === "py-2 px-3" ? "Normal" : "Spacious"}
                                </div>
                                <button
                                  className="p-0.5 bg-[#FFE0E0] rounded-r-md hover:bg-[#FFD0D0]"
                                  onClick={() => setTitlePadding(current => 
                                    current === "py-1 px-2" ? "py-2 px-3" : 
                                    current === "py-2 px-3" ? "py-3 px-3" : "py-3 px-3"
                                  )}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {availableDays.length === 0 && (
              <div className="mt-2 text-sm text-[#3A3A3A]">
                <h3 className="font-medium mb-1">Instructions:</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Paste your workshop data in either format:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-xs">
                      <li>Tab-separated: &quot;DayNumber DayName[tab]Time Workshop Title&quot;</li>
                      <li>Day-per-line: Day on its own line, followed by &quot;Time Workshop Title&quot; on subsequent lines</li>
                    </ul>
          </li>
                  <li>Make sure each entry is on a new line</li>
                  <li>Click &quot;Generate Schedule&quot; to create the calendar</li>
        </ol>
              </div>
            )}
          </div>
        </div>
      
        {/* Right side with schedule and download button */}
        <div className="lg:flex-1 flex flex-col items-end">
          {/* Schedule display with fixed 540x675 dimensions */}
          <div 
            ref={scheduleRef} 
            className="w-[540px] h-[675px] mx-auto lg:mx-0 relative rounded-xl overflow-hidden"
            style={{ 
              backgroundImage: `url(${backgroundImage})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center'
            }}
          >
            {availableDays.length > 0 ? (
              <div className={`h-full w-full ${topPadding} relative no-scrollbar`}>
                {logoPosition !== "none" && (
                  <div className={`absolute ${
                    logoPosition === "top-left" ? "top-2 left-2" : 
                    logoPosition === "top-right" ? "top-2 right-2" : 
                    logoPosition === "bottom-left" ? "bottom-2 left-2" : 
                    "bottom-2 right-2"
                  } z-10`}>
                    <Image
                      src="/logo-2.png" 
                      alt="Atölye Jeane Logo" 
                      width={80} 
                      height={32} 
                      className="h-auto opacity-80"
                    />
                  </div>
                )}
                
                {/* Always use 2 columns max regardless of day count */}
                <div style={bentoGridStyle}>
                  {availableDays.map(day => (
                    <DayBox 
                      key={day} 
                      day={day} 
                      workshops={workshops[day] || []}
                      headerFontSize={headerFontSize}
                      headerWeight={headerWeight} 
                      titleFontSize={titleFontSize}
                      titleWeight={titleWeight}
                      timeFontSize={timeFontSize}
                      timeWeight={timeWeight}
                      itemSpacing={itemSpacing}
                      titlePadding={titlePadding}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full w-full ${topPadding} relative`}>
                {logoPosition !== "none" && (
                  <div className={`absolute ${
                    logoPosition === "top-left" ? "top-2 left-2" : 
                    logoPosition === "top-right" ? "top-2 right-2" : 
                    logoPosition === "bottom-left" ? "bottom-2 left-2" : 
                    "bottom-2 right-2"
                  } z-10`}>
                    <Image
                      src="/logo-2.png" 
                      alt="Atölye Jeane Logo" 
                      width={80} 
                      height={32} 
                      className="h-auto opacity-80"
                    />
                  </div>
                )}
                
                <div className="text-center p-6 bg-white/90 rounded-lg border-2 border-black w-2/3">
                  <h2 className={`${playfair.className} text-2xl font-bold mb-2`}>No Schedule Generated</h2>
                  <p className={`${montserrat.className} font-semibold`}>Enter workshop details or try a sample.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Download Button below schedule */}
          {availableDays.length > 0 && (
            <button 
              className={`mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors font-medium ${
                downloadStatus === "downloading" 
                  ? "bg-gray-300 text-gray-600 cursor-wait" 
                  : downloadStatus === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : downloadStatus === "error"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-[#FFD0D0] text-[#3A3A3A] hover:bg-[#FFC0C0]"
              }`}
              onClick={downloadScheduleAsPNG}
              disabled={downloadStatus === "downloading"}
            >
              <Download size={16} />
              {downloadStatus === "downloading" ? "Preparing download..." : 
               downloadStatus === "success" ? "Downloaded!" :
               downloadStatus === "error" ? "Error, try again" :
               "Download as PNG"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Workshop Item Component
interface WorkshopItemProps {
  title: string;
  time: string;
  titleSize?: string;
  timeSize?: string;
  padding?: string;
  titleWeight?: string;
  timeWeight?: string;
}

function WorkshopItem({ 
  title, 
  time, 
  titleSize = "text-sm", 
  timeSize = "text-xs",
  padding = "py-0.5 px-1",
  titleWeight = "font-medium",
  timeWeight = "font-normal"
}: WorkshopItemProps) {
  return (
    <div className="text-center">
      <h3 className={`${titleSize} ${titleWeight} text-black leading-tight`}>{title}</h3>
      <p className={`${timeSize} ${timeWeight} text-black`}>{time}</p>
    </div>
  );
}

// Update the DayBox component to hide scrollbars
function DayBox({ 
  day, 
  workshops,
  headerFontSize,
  headerWeight,
  titleFontSize,
  titleWeight,
  timeFontSize,
  timeWeight,
  itemSpacing,
  titlePadding
}: { 
  day: string, 
  workshops: Workshop[],
  headerFontSize: string,
  headerWeight: string,
  titleFontSize: string,
  titleWeight: string,
  timeFontSize: string,
  timeWeight: string,
  itemSpacing: string,
  titlePadding: string
}) {
  return (
    <div className="bg-white/90 border-2 border-black rounded-xl overflow-hidden inline-block w-full mb-6 break-inside-avoid-column">
      <div className={`text-center ${titlePadding}`}>
        <h2 className={`${playfair.className} ${headerFontSize} ${headerWeight}`}>
          {day.split(' ')[0]} {day.split(' ')[1]}
        </h2>
      </div>
      <div className={`flex flex-col ${itemSpacing} p-5 no-scrollbar`}>
        {workshops.map((workshop, idx) => (
          <div key={idx} className="text-center py-1">
            <h3 className={`${montserrat.className} ${titleFontSize} ${titleWeight} leading-tight mb-2`}>{workshop.title}</h3>
            <p className={`${montserrat.className} ${timeFontSize} ${timeWeight}`}>{workshop.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}