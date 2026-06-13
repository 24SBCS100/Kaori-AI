"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquarePlus, 
  MessageSquare, 
  Archive, 
  Blocks, 
  Code,
  PanelLeftClose,
  ChevronDown,
  Trash2,
  Star
} from "lucide-react";
import { ChatThread } from "./chat-types";

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onToggleStarChat,
  open,
  onToggle,
  user,
  onOpenSettings,
  activeTab,
  onTabChange,
}: {
  chats: ChatThread[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, title: string) => void;
  onDeleteChat: (id: string) => void;
  onToggleStarChat: (id: string, isStarred: boolean) => void;
  open: boolean;
  onToggle: () => void;
  user: { id: string; name: string; email: string } | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const closeMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) onToggle();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={open ? { x: 0 } : { x: -288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-40 h-screen w-72 bg-[#f8f8f8] dark:bg-[#1c1c1c] border-r border-[#e5e5e5] dark:border-[#2a2a2a] flex flex-col font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <span className="font-serif text-2xl tracking-tight text-neutral-900 dark:text-neutral-100 font-medium">
            Kaori
          </span>
          <button
            onClick={onToggle}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors"
          >
            <PanelLeftClose size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Main Nav Items */}
        <div className="px-3 space-y-0.5 mt-2">
          <button 
            onClick={() => { onNewChat(); closeMobile(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageSquarePlus size={16} strokeWidth={1.5} />
            New chat
          </button>
          <button 
            onClick={() => { onTabChange('chats'); closeMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'chats' ? 'bg-neutral-200/80 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'}`}
          >
            <MessageSquare size={16} strokeWidth={1.5} />
            Chats
          </button>
          <button 
            onClick={() => { onTabChange('projects'); closeMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'projects' ? 'bg-neutral-200/80 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'}`}
          >
            <Archive size={16} strokeWidth={1.5} />
            Projects
          </button>
          <button 
            onClick={() => { onTabChange('artifacts'); closeMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'artifacts' ? 'bg-neutral-200/80 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'}`}
          >
            <Blocks size={16} strokeWidth={1.5} />
            Artifacts
          </button>
          <button 
            onClick={() => { onTabChange('code'); closeMobile(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === 'code' ? 'bg-neutral-200/80 dark:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'}`}
          >
            <Code size={16} strokeWidth={1.5} />
            Code
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 mt-6">
          {/* Starred */}
          {chats.some(c => c.isStarred) && (
            <div className="mb-6">
              <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Starred
              </div>
              <div className="space-y-0.5">
                {chats.filter(c => c.isStarred).map(chat => {
                  const active = chat.id === activeChatId;
                  return (
                    <div
                      key={chat.id}
                      className={`group relative flex items-center w-full rounded-lg transition-colors ${
                        active
                          ? "bg-[#efefef] dark:bg-[#2a2a2a]"
                          : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <button
                        onClick={() => { onSelectChat(chat.id); closeMobile(); }}
                        className={`flex-1 text-left px-3 py-2 text-sm truncate ${
                          active
                            ? "text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {chat.title}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStarChat(chat.id, false);
                        }}
                        className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-neutral-300/50 dark:hover:bg-neutral-700 text-yellow-500"
                        title="Unstar chat"
                      >
                        <Star size={14} fill="currentColor" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recents */}
          <div>
            <div className="px-3 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Recents
            </div>
            <div className="space-y-0.5 pb-4">
              {chats.slice(0, 10).map((chat) => {
                const active = chat.id === activeChatId;
                return (
                  <div
                    key={chat.id}
                    className={`group relative flex items-center w-full rounded-lg transition-colors ${
                      active
                        ? "bg-[#efefef] dark:bg-[#2a2a2a]"
                        : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <button
                      onClick={() => { onSelectChat(chat.id); closeMobile(); }}
                      className={`flex-1 text-left px-3 py-2 text-sm truncate ${
                        active
                          ? "text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {chat.title}
                    </button>
                    <div className="absolute right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStarChat(chat.id, !chat.isStarred);
                        }}
                        className={`p-1.5 rounded-md hover:bg-neutral-300/50 dark:hover:bg-neutral-700 ${
                          chat.isStarred ? "text-yellow-500" : "text-neutral-500 hover:text-yellow-500"
                        }`}
                        title={chat.isStarred ? "Unstar chat" : "Star chat"}
                      >
                        <Star size={14} fill={chat.isStarred ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-neutral-300/50 dark:hover:bg-neutral-700 text-neutral-500 hover:text-red-500"
                        title="Delete chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {chats.length === 0 && (
                <div className="px-3 py-2 text-sm text-neutral-400 italic">No recent chats</div>
              )}
            </div>
          </div>
        </div>

        {/* User section */}
        <div className="p-4">
          <button 
            onClick={() => { onOpenSettings(); closeMobile(); }}
            className="w-full flex items-center justify-between gap-3 px-2 py-2 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 shrink-0 rounded-full bg-[#d66f8f] flex items-center justify-center text-white font-serif text-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {user ? user.name : "Account"}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user?.email || "Signed in"}
                </div>
              </div>
            </div>
            <ChevronDown size={16} className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 shrink-0" strokeWidth={1.5} />
          </button>
        </div>
      </motion.aside>
    </>
  );
}
