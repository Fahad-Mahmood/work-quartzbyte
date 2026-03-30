import React, { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, FileText, Video, Link as LinkIcon, UploadCloud, Edit3, Eye, CheckSquare } from "lucide-react";
import { cn } from "../lib/utils";

export function VideoTrackerPage() {
  usePageTitle('Video Tracker');
  const [takes, setTakes] = useState([{ id: 1, scene: "", take: "", notes: "", date: "", approved: false }]);

  const addTake = () => {
    setTakes([...takes, { id: takes.length + 1, scene: "", take: "", notes: "", date: "", approved: false }]);
  };

  const statusSteps = ["Draft", "Scripted", "Recorded", "Edited", "Approved"];
  const currentStep = 2; // Mock current step

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] sticky top-4 z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2 uppercase tracking-[0.1em] font-inter">
            <Video className="h-4 w-4" />
            <span>Video Production</span>
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">Sleep Stages Explained</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low rounded-xl h-11 px-6 font-inter font-medium">Preview</Button>
          <Button className="bg-gradient-to-r from-primary to-primary-container text-on-primary hover:opacity-90 rounded-xl h-11 px-6 font-inter font-medium border-0 shadow-md">Save Progress</Button>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-container-high -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500" style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}></div>
          {statusSteps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={step} className="flex flex-col items-center gap-3 bg-surface px-2">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-300 font-inter",
                  isCompleted ? "bg-primary border-primary text-on-primary" : 
                  isCurrent ? "bg-surface-container-lowest border-primary text-primary shadow-md transform scale-110" : "bg-surface-container-lowest border-surface-container-high text-outline"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-[0.1em] font-inter",
                  isCompleted || isCurrent ? "text-on-surface" : "text-outline"
                )}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-10 mt-4">
        {/* Section 1: Info */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-secondary-container text-on-secondary-container p-2.5 rounded-xl"><FileText className="h-5 w-5" /></div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">1. Video Details</h2>
          </div>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px]">
            <CardContent className="grid sm:grid-cols-2 gap-8 p-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Creator</label>
                <Input defaultValue="Muhammad Affan" className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Target Date</label>
                <Input type="date" className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Format</label>
                <select className="flex h-12 w-full rounded-xl border-transparent bg-surface-container px-4 py-2 text-base font-inter text-on-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all">
                  <option>Instagram Reel</option>
                  <option>TikTok</option>
                  <option>YouTube Shorts</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Target Length</label>
                <Input defaultValue="30-60 seconds" className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Reference */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-tertiary-fixed text-on-tertiary-fixed p-2.5 rounded-xl"><LinkIcon className="h-5 w-5" /></div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">2. Reference Material</h2>
          </div>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px]">
            <CardContent className="grid gap-8 p-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Inspiration Link</label>
                <Input placeholder="Paste Instagram/TikTok link here..." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">What to copy</label>
                  <Input placeholder="e.g. hook style, pacing..." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Hook style</label>
                  <Input placeholder="e.g. Question, Visual..." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Notes for Editor</label>
                <Input placeholder="Match pacing, caption style and music energy." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Script */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-primary-fixed text-on-primary-fixed p-2.5 rounded-xl"><Edit3 className="h-5 w-5" /></div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">3. Script Draft</h2>
          </div>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px] overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-surface-container-low border-b border-surface-container-highest p-6 flex flex-wrap gap-3">
                {["Hook/Tips/CTA", "Comparison", "Myth Bust", "Storytime"].map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container cursor-pointer px-4 py-1.5 text-sm rounded-full font-medium font-inter transition-colors">
                    {tag}
                  </Badge>
                ))}
              </div>
              <textarea
                className="min-h-[300px] w-full resize-y bg-surface-container-lowest p-8 text-lg leading-relaxed placeholder:text-outline focus:outline-none font-inter text-on-surface"
                placeholder="Write your full script here. Expand freely..."
              />
            </CardContent>
          </Card>
        </section>

        {/* Section 4: Review Checklist */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-tertiary-fixed-dim text-on-tertiary-fixed p-2.5 rounded-xl"><CheckSquare className="h-5 w-5" /></div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">4. Pre-Recording Checklist</h2>
          </div>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px] overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-surface-container-highest">
                {[
                  "Grammar is correct - no spelling or punctuation errors",
                  "Language sounds natural and human - not AI-generated",
                  "Hook is strong - stops the scroll in first 2 seconds",
                  "Body flows logically - each point connects to the next",
                  "No filler phrases (e.g. 'In today's video')",
                  "WakeUp Better app is mentioned clearly in the CTA",
                  "Total word count fits 30-60 sec when spoken aloud",
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center gap-4 p-5 sm:px-8 hover:bg-surface-container-low cursor-pointer transition-colors">
                    <div className="flex-shrink-0">
                      <input type="checkbox" className="h-6 w-6 rounded-lg border-outline text-primary focus:ring-primary transition-all bg-surface-container-lowest" />
                    </div>
                    <span className="text-base text-on-surface leading-snug font-inter">{item}</span>
                  </label>
                ))}
              </div>
              <div className="bg-surface-container-low p-6 sm:px-8 border-t border-surface-container-highest flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-on-surface uppercase tracking-[0.1em] font-inter">Reviewer Sign-off:</span>
                  <Input className="w-48 h-11 bg-surface-container-lowest border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-inter" placeholder="Name" />
                </div>
                <div className="text-xs font-bold text-on-error-container bg-error-container px-4 py-2 rounded-full uppercase tracking-[0.1em] font-inter">
                  Recording cannot start without sign-off
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5: Scene Log */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-secondary-fixed text-on-secondary-fixed p-2.5 rounded-xl"><Video className="h-5 w-5" /></div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">5. Scene & Take Log</h2>
          </div>
          <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px] overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-base text-left font-inter">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold text-xs uppercase tracking-[0.1em] border-b border-surface-container-highest">
                  <tr>
                    <th className="px-6 py-4 w-16 text-center">#</th>
                    <th className="px-6 py-4 min-w-[200px]">Scene / Clip</th>
                    <th className="px-6 py-4 w-28">Take</th>
                    <th className="px-6 py-4 min-w-[250px]">Notes for Editor</th>
                    <th className="px-6 py-4 w-20 text-center">Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest">
                  {takes.map((take, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-outline">{idx + 1}</td>
                      <td className="px-6 py-4"><Input className="h-11 bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-inter" placeholder="e.g. Hook" /></td>
                      <td className="px-6 py-4"><Input className="h-11 bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-center font-inter" type="number" placeholder="1" /></td>
                      <td className="px-6 py-4"><Input className="h-11 bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-inter" placeholder="Good energy" /></td>
                      <td className="px-6 py-4 text-center">
                        <input type="checkbox" className="h-6 w-6 rounded-lg border-outline text-tertiary-fixed-dim focus:ring-tertiary-fixed-dim transition-all bg-surface-container-lowest" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 border-t border-surface-container-highest bg-surface-container-low/50">
                <Button variant="outline" onClick={addTake} className="bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container rounded-xl h-11 px-6 font-medium font-inter">
                  + Add Take Row
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 6: Handoff */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-primary-container text-on-primary-container p-2.5 rounded-xl"><UploadCloud className="h-5 w-5" /></div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">6. Editor Handoff</h2>
          </div>
          <div className="grid gap-8">
            {/* Step 1 */}
            <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px] overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary"></div>
              <CardContent className="p-8 pl-10">
                <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Creator: Upload Footage</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Drive Link</label>
                    <Input placeholder="Paste Google Drive link..." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Folder Name</label>
                    <Input placeholder="YYYY-MM-DD_V1_Topic" className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px] overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-secondary-container"></div>
              <CardContent className="p-8 pl-10">
                <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Editor: Confirm & Edit</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Canva Link</label>
                    <Input placeholder="Paste edited Canva link..." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] font-inter">Notes for Reviewer</label>
                    <Input placeholder="Any notes..." className="bg-surface-container border-transparent focus:border-primary focus:ring-1 focus:ring-primary h-12 rounded-xl text-base font-inter text-on-surface transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-0 shadow-[0_8px_32px_rgba(0,0,0,0.03)] bg-surface-container-lowest rounded-[24px] overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-tertiary-fixed-dim"></div>
              <CardContent className="p-8 pl-10">
                <h3 className="text-xl font-headline font-bold text-on-surface mb-6">Reviewer: Final Approval</h3>
                <div className="space-y-6">
                  <label className="flex items-center gap-4 p-4 border-0 bg-surface-container rounded-2xl cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input type="checkbox" className="h-6 w-6 rounded-lg border-outline text-tertiary-fixed-dim focus:ring-tertiary-fixed-dim transition-all bg-surface-container-lowest" />
                    <span className="text-base font-medium text-on-surface font-inter">I have watched the full edited video on Canva</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-gradient-to-r from-tertiary-fixed-dim to-tertiary-fixed text-on-tertiary-fixed border-0 shadow-md rounded-xl h-12 px-6 text-base font-inter font-bold hover:opacity-90 transition-opacity">
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Approve for Publishing
                    </Button>
                    <Button variant="outline" className="text-error border-error-container bg-surface-container-lowest hover:bg-error-container hover:text-on-error-container rounded-xl h-12 px-6 text-base font-inter font-bold transition-colors">
                      Request Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
