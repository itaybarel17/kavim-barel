import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Agent {
  agentnumber: string;
  agentname: string;
}

interface AgentFilterProps {
  agents: Agent[];
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
}

export const AgentFilter: React.FC<AgentFilterProps> = ({
  agents,
  selectedAgent,
  onAgentChange
}) => {
  // Add "משרד" option at the beginning
  const agentOptions = [
    { agentnumber: '4', agentname: 'משרד' },
    ...agents
      .filter(agent => agent.agentnumber !== '4' && agent.agentname)
      .sort((a, b) => (a.agentname || '').localeCompare(b.agentname || '', 'he'))
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-600">סוכן:</span>
      <Select value={selectedAgent} onValueChange={onAgentChange}>
        <SelectTrigger className="w-[180px] bg-white border-gray-300">
          <SelectValue placeholder="בחר סוכן" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
          {agentOptions.map((agent) => (
            <SelectItem 
              key={agent.agentnumber} 
              value={agent.agentnumber}
              className="hover:bg-gray-50 cursor-pointer"
            >
              {agent.agentname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};