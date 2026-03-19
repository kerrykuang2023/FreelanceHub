import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import PortalLayout from "@/components/layouts/portal/PortalLayout";

interface IMessage {
  id: string;
  sender: string;
  avatar?: string;
  preview: string;
  time: string;
  unread: boolean;
  jobTitle?: string;
}

const mockMessages: IMessage[] = [
  {
    id: "1",
    sender: "HR Team",
    preview: "Your application for Senior Developer position has been reviewed...",
    time: "2 hours ago",
    unread: true,
    jobTitle: "Senior Developer",
  },
  {
    id: "2",
    sender: "Tech Corp",
    preview: "Thank you for applying. We would like to schedule an interview...",
    time: "1 day ago",
    unread: false,
    jobTitle: "Full Stack Engineer",
  },
  {
    id: "3",
    sender: "Startup Inc",
    preview: "We have received your application and will review it shortly...",
    time: "3 days ago",
    unread: false,
    jobTitle: "Frontend Developer",
  },
];

const MessagesPage = () => {
  const navigate = useNavigate();
  const [selectedMessage, setSelectedMessage] = useState<IMessage | null>(null);
  const [messages] = useState<IMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <PortalLayout title="Messages">
      <div className="flex-1 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            Communicate with employers and recruiters
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex h-[600px]">
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="block w-full rounded-md border-0 py-2 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        selectedMessage?.id === message.id
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          {message.unread && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm font-medium ${
                                message.unread ? "text-gray-900" : "text-gray-600"
                              }`}
                            >
                              {message.sender}
                            </p>
                            <p className="text-xs text-gray-400">{message.time}</p>
                          </div>
                          {message.jobTitle && (
                            <p className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                              <BriefcaseIcon className="h-3 w-3" />
                              {message.jobTitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {message.preview}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedMessage ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selectedMessage.sender}
                      </h3>
                      {selectedMessage.jobTitle && (
                        <p className="text-xs text-indigo-600 flex items-center gap-1">
                          <BriefcaseIcon className="h-3 w-3" />
                          {selectedMessage.jobTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                        <p className="text-sm text-gray-900">
                          {selectedMessage.preview}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {selectedMessage.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-indigo-600 rounded-lg px-4 py-2 max-w-md">
                        <p className="text-sm text-white">
                          Thank you for your message. I'm very interested in this opportunity and would love to discuss further.
                        </p>
                        <p className="text-xs text-indigo-200 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 rounded-md border-0 py-2 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        <PaperAirplaneIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a message from the list to view the conversation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default MessagesPage;
