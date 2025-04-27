"use client";

import { Download, Plus, Minus } from "lucide-react";
import { useState, useRef } from "react";

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
  const [headerFontSize, setHeaderFontSize] = useState<"text-lg" | "text-xl" | "text-2xl">("text-xl");
  const [titleFontSize, setTitleFontSize] = useState<"text-xs" | "text-sm" | "text-base">("text-sm");
  const [timeFontSize, setTimeFontSize] = useState<"text-[10px]" | "text-xs" | "text-sm">("text-xs");
  const [itemSpacing, setItemSpacing] = useState<"gap-0.5" | "gap-1" | "gap-2">("gap-1");
  const [sectionSpacing, setSectionSpacing] = useState<"mb-2" | "mb-3" | "mb-4">("mb-3");
  const [itemPadding, setItemPadding] = useState<"py-0.5 px-1" | "py-1 px-2" | "py-1.5 px-2.5">("py-0.5 px-1");
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);

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

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-[#FDF2E7] p-4">
      <div className="flex flex-col lg:flex-row max-w-6xl w-full gap-6">
        {/* Left side - CSV Input area */}
        <div className="lg:flex-1 bg-white/90 rounded-xl shadow-lg flex flex-col overflow-hidden border border-[#E1D4C4]">
          <div className="bg-[#E1D4C4] p-2 text-center text-[#3A3A3A]">
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
                    className="text-xs text-[#7A6550] hover:underline"
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
                      className="text-xs text-[#7A6550] hover:underline"
                      onClick={() => setCsvInput(sampleTwoDays)}
                    >
                      2 Days Example
                    </button>
                    <button
                      className="text-xs text-[#7A6550] hover:underline"
                      onClick={() => setCsvInput(sampleThreeDays)}
                    >
                      3 Days Example
                    </button>
                    <button
                      className="text-xs text-[#7A6550] hover:underline"
                      onClick={() => setCsvInput(sampleDayPerLine)}
                    >
                      Day-Per-Line Format
                    </button>
                    <button
                      className="text-xs text-[#7A6550] hover:underline"
                      onClick={() => setCsvInput("")}
                    >
                      Clear
                    </button>
                  </div>
                  <textarea 
                    id="csvInput" 
                    className="p-2 border border-[#E1D4C4] rounded-md h-64 resize-none focus:outline-none focus:ring-1 focus:ring-[#C9B6A5] font-mono text-sm"
                    placeholder="Paste your workshop schedule data here..."
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                  ></textarea>
                </>
              )}
              
              {inputCollapsed && csvInput && (
                <div className="bg-gray-50 border border-[#E1D4C4] rounded-md p-2 text-sm font-mono line-clamp-3 text-gray-600 cursor-pointer" onClick={() => setInputCollapsed(false)}>
                  {csvInput.split('\n').slice(0, 3).join('\n')}
                  {csvInput.split('\n').length > 3 && '...'}
                </div>
              )}
            </div>
            
            {!inputCollapsed && (
              <button 
                className="mt-2 bg-[#C9B6A5] text-[#3A3A3A] py-2 px-4 rounded-md hover:bg-[#BCA895] transition-colors font-medium"
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
                  <div className="border-t border-[#E1D4C4] pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-[#3A3A3A]">Display Settings</h3>
                      <button
                        className="text-xs text-[#7A6550] hover:underline"
                        onClick={() => setShowDisplaySettings(!showDisplaySettings)}
                      >
                        {showDisplaySettings ? "Hide" : "Show"}
                      </button>
                    </div>
                    
                    {showDisplaySettings && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#7A6550]">Day Header Font Size</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-l-md hover:bg-[#D1C4B4]"
                              onClick={() => setHeaderFontSize(current => 
                                current === "text-lg" ? "text-lg" : 
                                current === "text-xl" ? "text-lg" : "text-xl"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#E1D4C4] flex-1 text-center text-sm">
                              {headerFontSize === "text-lg" ? "Small" : 
                               headerFontSize === "text-xl" ? "Medium" : "Large"}
                            </div>
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-r-md hover:bg-[#D1C4B4]"
                              onClick={() => setHeaderFontSize(current => 
                                current === "text-lg" ? "text-xl" : 
                                current === "text-xl" ? "text-2xl" : "text-2xl"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#7A6550]">Workshop Title Font Size</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-l-md hover:bg-[#D1C4B4]"
                              onClick={() => setTitleFontSize(current => 
                                current === "text-xs" ? "text-xs" : 
                                current === "text-sm" ? "text-xs" : "text-sm"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#E1D4C4] flex-1 text-center text-sm">
                              {titleFontSize === "text-xs" ? "Small" : 
                               titleFontSize === "text-sm" ? "Medium" : "Large"}
                            </div>
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-r-md hover:bg-[#D1C4B4]"
                              onClick={() => setTitleFontSize(current => 
                                current === "text-xs" ? "text-sm" : 
                                current === "text-sm" ? "text-base" : "text-base"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#7A6550]">Time Font Size</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-l-md hover:bg-[#D1C4B4]"
                              onClick={() => setTimeFontSize(current => 
                                current === "text-[10px]" ? "text-[10px]" : 
                                current === "text-xs" ? "text-[10px]" : "text-xs"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#E1D4C4] flex-1 text-center text-sm">
                              {timeFontSize === "text-[10px]" ? "Small" : 
                               timeFontSize === "text-xs" ? "Medium" : "Large"}
                            </div>
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-r-md hover:bg-[#D1C4B4]"
                              onClick={() => setTimeFontSize(current => 
                                current === "text-[10px]" ? "text-xs" : 
                                current === "text-xs" ? "text-sm" : "text-sm"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#7A6550]">Spacing Between Workshops</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-l-md hover:bg-[#D1C4B4]"
                              onClick={() => setItemSpacing(current => 
                                current === "gap-0.5" ? "gap-0.5" : 
                                current === "gap-1" ? "gap-0.5" : "gap-1"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#E1D4C4] flex-1 text-center text-sm">
                              {itemSpacing === "gap-0.5" ? "Compact" : 
                               itemSpacing === "gap-1" ? "Normal" : "Spacious"}
                            </div>
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-r-md hover:bg-[#D1C4B4]"
                              onClick={() => setItemSpacing(current => 
                                current === "gap-0.5" ? "gap-1" : 
                                current === "gap-1" ? "gap-2" : "gap-2"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#7A6550]">Workshop Padding</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-l-md hover:bg-[#D1C4B4]"
                              onClick={() => setItemPadding(current => 
                                current === "py-0.5 px-1" ? "py-0.5 px-1" : 
                                current === "py-1 px-2" ? "py-0.5 px-1" : "py-1 px-2"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#E1D4C4] flex-1 text-center text-sm">
                              {itemPadding === "py-0.5 px-1" ? "Compact" : 
                               itemPadding === "py-1 px-2" ? "Normal" : "Spacious"}
                            </div>
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-r-md hover:bg-[#D1C4B4]"
                              onClick={() => setItemPadding(current => 
                                current === "py-0.5 px-1" ? "py-1 px-2" : 
                                current === "py-1 px-2" ? "py-1.5 px-2.5" : "py-1.5 px-2.5"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#7A6550]">Section Spacing</label>
                          <div className="flex items-center">
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-l-md hover:bg-[#D1C4B4]"
                              onClick={() => setSectionSpacing(current => 
                                current === "mb-2" ? "mb-2" : 
                                current === "mb-3" ? "mb-2" : "mb-3"
                              )}
                            >
                              <Minus size={14} />
                            </button>
                            <div className="px-2 bg-white border-y border-[#E1D4C4] flex-1 text-center text-sm">
                              {sectionSpacing === "mb-2" ? "Compact" : 
                               sectionSpacing === "mb-3" ? "Normal" : "Spacious"}
                            </div>
                            <button
                              className="p-1 bg-[#E1D4C4] rounded-r-md hover:bg-[#D1C4B4]"
                              onClick={() => setSectionSpacing(current => 
                                current === "mb-2" ? "mb-3" : 
                                current === "mb-3" ? "mb-4" : "mb-4"
                              )}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Download Button */}
                <button 
                  className={`mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors font-medium ${
                    downloadStatus === "downloading" 
                      ? "bg-gray-300 text-gray-600 cursor-wait" 
                      : downloadStatus === "success"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : downloadStatus === "error"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-[#E1D4C4] text-[#3A3A3A] hover:bg-[#D1C4B4]"
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
      
        {/* Right side - Schedule display with fixed 540x675 dimensions */}
        <div 
          ref={scheduleRef} 
          className="w-[540px] h-[675px] mx-auto lg:mx-0 relative rounded-xl overflow-hidden" 
          style={{ 
            backgroundImage: 'url(/backgorund.png)', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          }}
        >
          {availableDays.length > 0 ? (
            <div className={`h-full p-2 ${availableDays.length === 1 ? 'flex justify-center' : 'grid grid-cols-2 gap-2'}`}>
              {/* Single day layout or Left column for multiple days */}
              <div className={`h-full flex flex-col ${availableDays.length === 1 ? 'w-1/2' : ''}`}>
                {columnDays.left.map((dayKey) => (
                  <div key={dayKey} className={`${sectionSpacing} last:mb-0`}>
                    <div className="text-center mb-1">
                      <h2 className={`${headerFontSize} font-serif text-[#3A3A3A]`}>
                        {formatDayName(dayKey)}
                      </h2>
                    </div>
                    
                    <div className={`flex flex-col ${itemSpacing}`}>
                      {workshops[dayKey]?.map((workshop, idx) => (
                        <WorkshopItem 
                          key={idx}
                          title={workshop.title} 
                          time={workshop.time}
                          titleSize={titleFontSize}
                          timeSize={timeFontSize}
                          padding={itemPadding}
                        />
                      ))}
                      
                      {(!workshops[dayKey] || workshops[dayKey].length === 0) && (
                        <div className="text-center py-1 text-[#3A3A3A]/50 italic text-sm">
                          No workshops scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Right column - only shown with multiple days */}
              {availableDays.length > 1 && (
                <div className="h-full flex flex-col">
                  {columnDays.right.map((dayKey) => (
                    <div key={dayKey} className={`${sectionSpacing} last:mb-0`}>
                      <div className="text-center mb-1">
                        <h2 className={`${headerFontSize} font-serif text-[#3A3A3A]`}>
                          {formatDayName(dayKey)}
                        </h2>
                      </div>
                      
                      <div className={`flex flex-col ${itemSpacing}`}>
                        {workshops[dayKey]?.map((workshop, idx) => (
                          <WorkshopItem 
                            key={idx}
                            title={workshop.title} 
                            time={workshop.time}
                            titleSize={titleFontSize}
                            timeSize={timeFontSize}
                            padding={itemPadding}
                          />
                        ))}
                        
                        {(!workshops[dayKey] || workshops[dayKey].length === 0) && (
                          <div className="text-center py-1 text-[#3A3A3A]/50 italic text-sm">
                            No workshops scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#3A3A3A] bg-white/80 p-4">
              <p className="text-lg font-medium mb-2">No Schedule Generated</p>
              <p className="text-sm text-center max-w-xs">
                Paste your workshop data in the input field on the left and click &quot;Generate Schedule&quot; to view the calendar.
              </p>
            </div>
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
}

function WorkshopItem({ 
  title, 
  time, 
  titleSize = "text-sm", 
  timeSize = "text-xs",
  padding = "py-1 px-2" 
}: WorkshopItemProps) {
  return (
    <div className={`bg-white/90 rounded-md border border-[#E1D4C4] ${padding} flex flex-col items-center text-center`}>
      <h3 className={`${titleSize} font-medium text-[#3A3A3A] leading-tight`}>{title}</h3>
      <p className={`${timeSize} text-[#7A6550]`}>{time}</p>
    </div>
  );
}
