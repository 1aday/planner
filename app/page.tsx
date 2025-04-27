"use client";

import { Download } from "lucide-react";
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
    
    lines.forEach(line => {
      // Expected format: "1 Perşembe\t13.00-15.00 Örgünü Al Gel Atölyesi (ÜCRETSİZ)"
      const match = line.match(/^(\d+)\s+([^\t]+)\t([\d\.\-]+)\s+(.+)$/);
      
      if (match) {
        const [, dayNumber, day, time, title] = match;
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
      }
    });
    
    // Update workshops state
    setWorkshops(parsedWorkshops);
    
    // Update available days
    const days = Object.keys(parsedWorkshops);
    setAvailableDays(days);
    
    // Distribute days between columns
    setColumnDays(distributeDays(days, parsedWorkshops));
  };

  // Sample CSV data for two days
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

  // Sample CSV data for three days
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
          <div className="flex-grow p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="csvInput" className="text-sm font-medium text-[#3A3A3A]">
                Paste CSV Data (Format: &quot;Day# DayName[tab]Time Title&quot;)
              </label>
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
            </div>
            
            <button 
              className="mt-2 bg-[#C9B6A5] text-[#3A3A3A] py-2 px-4 rounded-md hover:bg-[#BCA895] transition-colors font-medium"
              onClick={parseCSV}
              disabled={!csvInput.trim()}
            >
              Generate Schedule
            </button>
            
            {availableDays.length > 0 && (
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
            )}
            
            <div className="mt-2 text-sm text-[#3A3A3A]">
              <h3 className="font-medium mb-1">Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Paste your workshop data in the format shown in the example</li>
                <li>Make sure each workshop is on a new line</li>
                <li>Format: &quot;DayNumber DayName[tab]Time Workshop Title&quot;</li>
                <li>Click &quot;Generate Schedule&quot; to create the calendar</li>
              </ol>
            </div>
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
            <div className="grid grid-cols-2 gap-2 h-full p-2">
              {/* Left column - can contain multiple days */}
              <div className="h-full flex flex-col">
                {columnDays.left.map((dayKey) => (
                  <div key={dayKey} className="mb-2 last:mb-0">
                    <div className="text-center mb-1">
                      <h2 className="text-lg font-serif text-[#3A3A3A]">
                        {formatDayName(dayKey)}
                      </h2>
                    </div>
                    
                    <div className="flex flex-col gap-[2px]">
                      {workshops[dayKey]?.map((workshop, idx) => (
                        <WorkshopItem 
                          key={idx}
                          title={workshop.title} 
                          time={workshop.time} 
                        />
                      ))}
                      
                      {(!workshops[dayKey] || workshops[dayKey].length === 0) && (
                        <div className="text-center py-1 text-[#3A3A3A]/50 italic text-xs">
                          No workshops scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Right column - can contain multiple days */}
              <div className="h-full flex flex-col">
                {columnDays.right.map((dayKey) => (
                  <div key={dayKey} className="mb-2 last:mb-0">
                    <div className="text-center mb-1">
                      <h2 className="text-lg font-serif text-[#3A3A3A]">
                        {formatDayName(dayKey)}
                      </h2>
                    </div>
                    
                    <div className="flex flex-col gap-[2px]">
                      {workshops[dayKey]?.map((workshop, idx) => (
                        <WorkshopItem 
                          key={idx}
                          title={workshop.title} 
                          time={workshop.time} 
                        />
                      ))}
                      
                      {(!workshops[dayKey] || workshops[dayKey].length === 0) && (
                        <div className="text-center py-1 text-[#3A3A3A]/50 italic text-xs">
                          No workshops scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#3A3A3A] bg-white/80 p-6">
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
}

function WorkshopItem({ title, time }: WorkshopItemProps) {
  return (
    <div className="bg-white/90 rounded-md border border-[#E1D4C4] py-0.5 px-1 flex flex-col items-center text-center">
      <h3 className="text-xs font-medium text-[#3A3A3A] leading-tight">{title}</h3>
      <p className="text-[10px] text-[#7A6550]">{time}</p>
    </div>
  );
}
