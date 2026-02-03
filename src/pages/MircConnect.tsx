/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { Link } from "react-router-dom";
import { ArrowLeft, Server, Lock, Hash, User, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MircConnect = () => {
  return (
    <div className="min-h-screen bg-[#f0f0f0]" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
      {/* Classic mIRC-style header */}
      <div className="bg-gradient-to-r from-[#000080] to-[#0000cd] text-white py-3 px-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ffff00] rounded flex items-center justify-center">
              <span className="text-black font-bold text-sm">mIRC</span>
            </div>
            <h1 className="text-xl font-bold">Connect to Justachat with mIRC</h1>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-[#c0c0c0] text-black border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] hover:bg-[#d0d0d0]">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Lobby
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Server Info Card - Windows 95 style */}
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] mb-6">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-3 py-1.5 font-bold text-sm flex items-center gap-2">
            <Server className="w-4 h-4" />
            Server Information
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#808080] p-3">
              <p className="text-sm font-bold text-[#000080] mb-1">Server Address:</p>
              <code className="text-lg font-mono bg-[#ffffcc] px-2 py-1 border border-[#808080]">157.245.174.197</code>
            </div>
            <div className="bg-white border border-[#808080] p-3">
              <p className="text-sm font-bold text-[#000080] mb-1">Port (SSL):</p>
              <code className="text-lg font-mono bg-[#ffffcc] px-2 py-1 border border-[#808080]">6697</code>
              <span className="ml-2 text-xs text-green-700">(Recommended)</span>
            </div>
            <div className="bg-white border border-[#808080] p-3">
              <p className="text-sm font-bold text-[#000080] mb-1">Port (Non-SSL):</p>
              <code className="text-lg font-mono bg-[#ffffcc] px-2 py-1 border border-[#808080]">6667</code>
            </div>
            <div className="bg-white border border-[#808080] p-3">
              <p className="text-sm font-bold text-[#000080] mb-1">Default Channel:</p>
              <code className="text-lg font-mono bg-[#ffffcc] px-2 py-1 border border-[#808080]">#general</code>
            </div>
          </div>
        </div>

        {/* Step by Step Guide */}
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] mb-6">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-3 py-1.5 font-bold text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Step-by-Step Connection Guide
          </div>
          <div className="p-4 space-y-4">
            {/* Step 1 */}
            <div className="bg-white border border-[#808080] p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#000080] text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#000080] mb-2">Open mIRC and go to Options</h3>
                  <p className="text-sm text-gray-700 mb-3">Press <kbd className="bg-[#e0e0e0] px-2 py-0.5 border border-[#808080] font-mono text-xs">Alt + O</kbd> or go to <strong>Tools → Options</strong></p>
                  <div className="bg-[#ffffee] border border-[#cccc99] p-3 rounded">
                    <img 
                      src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=300&fit=crop" 
                      alt="mIRC Options menu" 
                      className="w-full max-w-md rounded border border-[#808080]"
                    />
                    <p className="text-xs text-gray-600 mt-2 italic">Open the Options dialog from the Tools menu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[#808080] p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#000080] text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#000080] mb-2">Add Justachat Server</h3>
                  <p className="text-sm text-gray-700 mb-3">In the <strong>Connect → Servers</strong> section, click <strong>Add</strong> and enter:</p>
                  <div className="bg-[#f8f8f8] border border-[#ccc] p-3 font-mono text-sm space-y-1">
                    <p><span className="text-[#808080]">Description:</span> <span className="text-[#000080]">Justachat</span></p>
                    <p><span className="text-[#808080]">IRC Server:</span> <span className="text-[#000080]">157.245.174.197</span></p>
                    <p><span className="text-[#808080]">Ports:</span> <span className="text-[#000080]">+6697</span> <span className="text-xs text-green-700">(the + means SSL)</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[#808080] p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#000080] text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#000080] mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Set Your Login Password
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">In the <strong>Connect → Options</strong> section, set your <strong>Password</strong> field to:</p>
                  <div className="bg-[#fff0f0] border border-[#cc9999] p-3 rounded">
                    <code className="font-mono text-lg bg-[#ffffcc] px-2 py-1 border border-[#808080]">your-email;your-password</code>
                    <p className="text-sm text-gray-600 mt-2">
                      <AlertCircle className="w-4 h-4 inline mr-1 text-orange-600" />
                      Use a <strong>semicolon (;)</strong> to separate your email and password
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Example: <code className="bg-gray-100 px-1">john@example.com;MySecretPass123</code></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-[#808080] p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#000080] text-white rounded-full flex items-center justify-center font-bold shrink-0">4</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#000080] mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Set Your Nickname
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">In <strong>Connect → Options</strong>, set your <strong>Nickname</strong> to match your Justachat username.</p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white border border-[#808080] p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#008000] text-white rounded-full flex items-center justify-center font-bold shrink-0">5</div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#008000] mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Connect and Join!
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">Click <strong>Connect</strong> and you'll be automatically joined to <strong>#general</strong>. You can also type:</p>
                  <div className="bg-black text-[#00ff00] font-mono p-3 rounded text-sm">
                    <p>/server 157.245.174.197 +6697</p>
                    <p>/join #general</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Command Reference */}
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] mb-6">
          <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-3 py-1.5 font-bold text-sm">
            Quick Commands
          </div>
          <div className="p-4 bg-black text-[#00ff00] font-mono text-sm space-y-1">
            <p><span className="text-[#ffff00]">/join #channel</span> - Join a channel</p>
            <p><span className="text-[#ffff00]">/part #channel</span> - Leave a channel</p>
            <p><span className="text-[#ffff00]">/msg nickname message</span> - Send a private message</p>
            <p><span className="text-[#ffff00]">/nick newnickname</span> - Change your nickname</p>
            <p><span className="text-[#ffff00]">/quit</span> - Disconnect from the server</p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]">
          <div className="bg-gradient-to-r from-[#800000] to-[#cc0000] text-white px-3 py-1.5 font-bold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Troubleshooting
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-white border border-[#808080] p-3">
              <p className="font-bold text-sm text-[#800000]">Connection Refused?</p>
              <p className="text-sm text-gray-700">Make sure you're using port <strong>+6697</strong> (with the + for SSL) or <strong>6667</strong> for non-SSL.</p>
            </div>
            <div className="bg-white border border-[#808080] p-3">
              <p className="font-bold text-sm text-[#800000]">Invalid Password?</p>
              <p className="text-sm text-gray-700">Double-check your password format: <code className="bg-gray-100 px-1">email;password</code> with a semicolon separator.</p>
            </div>
            <div className="bg-white border border-[#808080] p-3">
              <p className="font-bold text-sm text-[#800000]">Need Help?</p>
              <p className="text-sm text-gray-700">Join <strong>#help</strong> in the web client or email <a href="mailto:support@justachat.com" className="text-[#0000ff] underline">support@justachat.com</a></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Don't have an account? <Link to="/home" className="text-[#0000ff] underline">Sign up on the web first</Link></p>
        </div>
      </div>
    </div>
  );
};

export default MircConnect;
