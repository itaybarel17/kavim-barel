import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DropZone } from '@/components/distribution/DropZone';
import { UnassignedArea } from '@/components/distribution/UnassignedArea';
import { HorizontalKanban } from '@/components/calendar/HorizontalKanban';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Loader2, Calendar, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CentralAlertBanner } from '@/components/distribution/CentralAlertBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { WarehouseMessageBanner } from '@/components/distribution/WarehouseMessageBanner';
import { CustomerMessageBanner } from '@/components/distribution/CustomerMessageBanner';
import { getCustomerReplacementMap, getReplacementCustomerDetails } from '@/utils/scheduleUtils';

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  orderdate?: string;
  invoicenumber?: number;
  totalinvoice?: number;
  hour?: string;
  remark?: string;
  done_mainorder?: string | null;
  ordercancel?: string | null;
  alert_status?: boolean;
  ezor1?: string;
  ezor2?: string;
  day1?: string;
  day2?: string;
  end_picking_time?: string | null;
  hashavshevet?: string | null;
  message_alert?: boolean | null;
}
interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
  schedule_id?: number;
  icecream?: string;
  customernumber?: string;
  agentnumber?: string;
  returndate?: string;
  hour?: string;
  remark?: string;
  done_return?: string | null;
  returncancel?: string | null;
  alert_status?: boolean;
  message_alert?: boolean | null;
}
interface DistributionGroup {
  groups_id: number;
  separation: string;
  days?: any; // JSONB array
}
interface DistributionSchedule {
  schedule_id: number;
  groups_id: number;
  create_at_schedule: string;
  driver_id?: number;
  distribution_date?: string;
  isPinned?: boolean;
  message_alert?: boolean;
}
interface Driver {
  id: number;
  nahag: string;
}
interface CustomerSupply {
  customernumber: string;
  customername?: string;
  supplydetails?: string;
  address?: string;
  city?: string;
  mobile?: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

const Distribution = () => {
  const [draggedItem, setDraggedItem] = useState<{
    type: 'order' | 'return';
    data: Order | Return;
  } | null>(null);
  
  // Add state for zone-schedule mapping
  const [zoneScheduleMapping, setZoneScheduleMapping] = useState<Record<number, number | null>>({});
  
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user: currentUser
  } = useAuth();
  
  const isMobile = useIsMobile();

  // Set up realtime subscriptions
  useRealtimeSubscription();

  // Add simple page refresh every 10 minutes for desktop only
  useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        window.location.reload();
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearInterval(interval);
    }
  }, [isMobile]);

  // Helper function to filter orders based on user permissions
  const filterOrdersByUser = (orders: Order[]) => {
    // Agent 99 can only see their own orders
    if (currentUser?.agentnumber === '99') {
      return orders.filter(order => order.agentnumber === '99');
    }
    // All other agents can see everything
    return orders;
  };

  // Helper function to filter returns based on user permissions
  const filterReturnsByUser = (returns: Return[]) => {
    // Agent 99 can only see their own returns
    if (currentUser?.agentnumber === '99') {
      return returns.filter(returnItem => returnItem.agentnumber === '99');
    }
    // All other agents can see everything
    return returns;
  };

  // Query to get agent 99's customer areas from candycustomerlist
  const { data: candyCustomerAreas = [] } = useQuery({
    queryKey: ['candyCustomerAreas', currentUser?.agentnumber],
    queryFn: async () => {
      if (currentUser?.agentnumber !== '99') return [];
      
      const { data, error } = await supabase
        .from('candycustomerlist')
        .select('newarea, city_area, extraarea')
        .eq('agentnumber', '99');
      
      if (error) throw error;
      
      // Extract all unique areas
      const areas = new Set<string>();
      data.forEach(customer => {
        const mainArea = customer.newarea || customer.city_area;
        if (mainArea) areas.add(mainArea);
        if (customer.extraarea) areas.add(customer.extraarea);
      });
      
      return Array.from(areas);
    },
    enabled: currentUser?.agentnumber === '99'
  });

  // Helper function to filter distribution groups based on user permissions
  const filterDistributionGroupsByUser = (groups: DistributionGroup[], orders: Order[], returns: Return[]) => {
    // Agent 99 should only see groups that have their own active orders or returns
    if (currentUser?.agentnumber === '99') {
      const agent99Orders = orders.filter(order => order.agentnumber === '99');
      const agent99Returns = returns.filter(returnItem => returnItem.agentnumber === '99');
      
      // Get all areas from agent 99's orders and returns
      const agent99Areas = new Set<string>();
      
      agent99Orders.forEach(order => {
        if (order.ezor1) {
          // ezor1 can be like "[אזור א]" or "[אזור א, אזור ב]"
          const areas = order.ezor1.replace(/[\[\]]/g, '').split(',').map(area => area.trim());
          areas.forEach(area => agent99Areas.add(area));
        }
        if (order.ezor2) {
          agent99Areas.add(order.ezor2);
        }
      });
      
      agent99Returns.forEach(returnItem => {
        // Returns don't have ezor1/ezor2, so we need to get them from candycustomerlist
        // Add all areas from candycustomerlist for returns
        candyCustomerAreas.forEach(area => agent99Areas.add(area));
      });
      
      // Also add areas from candycustomerlist to ensure coverage
      candyCustomerAreas.forEach(area => agent99Areas.add(area));
      
      // If no areas found, get all groups to be safe (fallback)
      if (agent99Areas.size === 0) {
        return groups;
      }
      
      // Filter groups to only those that match agent 99's areas
      return groups.filter(group => agent99Areas.has(group.separation));
    }
    
    // All other agents can see all groups
    return groups;
  };

  // Fetch orders (exclude produced orders: done_mainorder IS NOT NULL and deleted orders: ordercancel IS NOT NULL)
  const {
    data: allOrders = [],
    refetch: refetchOrders,
    isLoading: ordersLoading
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      console.log('Fetching orders...');
      const {
        data,
        error
      } = await supabase.from('mainorder').select('ordernumber, customername, address, city, totalorder, schedule_id, icecream, customernumber, agentnumber, orderdate, invoicenumber, totalinvoice, hour, remark, alert_status, ezor1, ezor2, day1, day2, end_picking_time, hashavshevet, message_alert').or('icecream.is.null,icecream.eq.').is('done_mainorder', null).is('ordercancel', null) // Exclude deleted orders
      .order('ordernumber', {
        ascending: false
      });
      if (error) throw error;
      console.log('Orders fetched:', data);
      return data as Order[];
    }
  });

  // Fetch returns (exclude produced returns: done_return IS NOT NULL and deleted returns: returncancel IS NOT NULL)
  const {
    data: allReturns = [],
    refetch: refetchReturns,
    isLoading: returnsLoading
  } = useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      console.log('Fetching returns...');
      const {
        data,
        error
      } = await supabase.from('mainreturns').select('returnnumber, customername, address, city, totalreturn, schedule_id, icecream, customernumber, agentnumber, returndate, hour, remark, alert_status, message_alert').or('icecream.is.null,icecream.eq.').is('done_return', null).is('returncancel', null) // Exclude deleted returns
      .order('returnnumber', {
        ascending: false
      });
      if (error) throw error;
      console.log('Returns fetched:', data);
      return data as Return[];
    }
  });

  // Apply user permissions filtering
  const orders = filterOrdersByUser(allOrders);
  const returns = filterReturnsByUser(allReturns);

  // Fetch customer supply details
  const {
    data: customerSupplyData = [],
    isLoading: customerSupplyLoading
  } = useQuery({
    queryKey: ['customer-supply'],
    queryFn: async () => {
      console.log('Fetching customer supply details...');
      const {
        data,
        error
      } = await supabase.from('customerlist').select('customernumber, customername, supplydetails, address, city, mobile, phone, lat, lng');
      if (error) throw error;
      console.log('Customer supply data fetched:', data);
      return data;
    }
  });

  // Fetch distribution groups
  const {
    data: distributionGroups = [],
    isLoading: groupsLoading
  } = useQuery({
    queryKey: ['distribution-groups'],
    queryFn: async () => {
      console.log('Fetching distribution groups...');
      const {
        data,
        error
      } = await supabase.from('distribution_groups').select('groups_id, separation, day, days');
      if (error) throw error;
      console.log('Distribution groups fetched:', data);
      return data as DistributionGroup[];
    }
  });

  // Fetch ONLY ACTIVE distribution schedules with isPinned - filter out produced ones (done_schedule IS NOT NULL)
  const {
    data: distributionSchedules = [],
    refetch: refetchSchedules,
    isLoading: schedulesLoading
  } = useQuery({
    queryKey: ['distribution-schedules'],
    queryFn: async () => {
      console.log('Fetching active distribution schedules...');
      const {
        data,
        error
      } = await supabase.from('distribution_schedule').select('schedule_id, groups_id, create_at_schedule, driver_id, distribution_date, isPinned, message_alert').is('done_schedule', null); // Only get active schedules, not produced ones

      if (error) throw error;
      console.log('Active distribution schedules fetched:', data);
      return data as DistributionSchedule[];
    }
  });

  // Fetch drivers
  const {
    data: drivers = [],
    isLoading: driversLoading
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      console.log('Fetching drivers...');
      const {
        data,
        error
      } = await supabase.from('nahagim').select('id, nahag').order('nahag');
      if (error) throw error;
      console.log('Drivers fetched:', data);
      return data as Driver[];
    }
  });

  // Create map for customer supply lookup
  const customerSupplyMap = customerSupplyData.reduce((map, customer) => {
    map[customer.customernumber] = customer.supplydetails || '';
    return map;
  }, {} as Record<string, string>);

  // Create map for customer coordinates lookup
  const customerCoordinatesMap = customerSupplyData.reduce((map, customer) => {
    if (customer.lat && customer.lng) {
      map[customer.customernumber] = { lat: customer.lat, lng: customer.lng };
    }
    return map;
  }, {} as Record<string, { lat: number; lng: number }>);

  // Filter distribution groups based on user permissions (must be after distributionGroups is fetched)
  const filteredDistributionGroups = filterDistributionGroupsByUser(distributionGroups, orders, returns);


  // --- BEGIN CUSTOMER STATUS LOGIC FOR ICONS ---
  // ACTIVE order: done_mainorder == null && ordercancel == null
  // ACTIVE return: done_return == null && returncancel == null
  function isOrderActive(order: Order) {
    return !order.done_mainorder && !order.ordercancel;
  }
  function isReturnActive(ret: Return) {
    return !ret.done_return && !ret.returncancel;
  }

  // 1. multi-active-order customers (blue icon)
  const activeOrders = orders.filter(isOrderActive);
  const customerMap: Record<string, Order[]> = {};
  activeOrders.forEach(order => {
    const key = `${order.customername}^^${order.city}`;
    if (!customerMap[key]) customerMap[key] = [];
    customerMap[key].push(order);
  });
  const multiOrderActiveCustomerList = Object.entries(customerMap).filter(([_, arr]) => arr.length >= 2).map(([key]) => {
    const [name, city] = key.split('^^');
    return {
      name,
      city
    };
  });

  // 2. customers with BOTH active order and active return (red icon)
  const activeReturns = returns.filter(isReturnActive);
  const orderKeys = new Set(activeOrders.map(o => `${o.customername}^^${o.city}`));
  const returnKeys = new Set(activeReturns.map(r => `${r.customername}^^${r.city}`));
  const dualActiveOrderReturnCustomers: {
    name: string;
    city: string;
  }[] = [];
  orderKeys.forEach(k => {
    if (returnKeys.has(k)) {
      const [name, city] = k.split('^^');
      dualActiveOrderReturnCustomers.push({
        name,
        city
      });
    }
  });

  // Add query for warehouse messages (only for user 4)
  const { data: warehouseMessages = [] } = useQuery({
    queryKey: ['warehouse-messages'],
    queryFn: async () => {
      if (currentUser?.agentnumber !== "4") {
        return [];
      }
      
      console.log('Fetching warehouse messages...');
      const { data, error } = await supabase
        .from('messages')
        .select('messages_id, content, is_handled, created_at')
        .eq('subject', 'מחסן')
        .eq('is_handled', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Warehouse messages fetched:', data);
      return data;
    },
    enabled: currentUser?.agentnumber === "4"
  });

  // Simplified query for customer messages with message_alert = true
  const { data: customerMessages = [] } = useQuery({
    queryKey: ['customer-messages'],
    queryFn: async () => {
      console.log('Fetching customer messages...');
      
      // Get orders with message_alert = true
      const { data: orderMessages, error: orderError } = await supabase
        .from('mainorder')
        .select('customername, city, ordernumber')
        .eq('message_alert', true);
      
      if (orderError) throw orderError;

      // Get returns with message_alert = true  
      const { data: returnMessages, error: returnError } = await supabase
        .from('mainreturns')
        .select('customername, city, returnnumber')
        .eq('message_alert', true);
        
      if (returnError) throw returnError;

      // Get the corresponding message subjects only if we have any orders/returns
      const groupedMessages = new Map<string, {
        subject: string;
        customername: string;
        city: string;
        relatedItems: Array<{ type: 'order' | 'return'; id: number; customername: string; }>;
      }>();
      
      if (orderMessages && orderMessages.length > 0) {
        const orderNums = orderMessages.map(o => o.ordernumber);
        const { data: orderMessageSubjects, error: orderMsgError } = await supabase
          .from('messages')
          .select('subject, ordernumber, correctcustomer, city')
          .in('ordernumber', orderNums)
          .neq('subject', 'מחסן')
          .eq('is_handled', false)
          .order('created_at', { ascending: false });
          
        if (orderMsgError) throw orderMsgError;

        orderMessages.forEach(order => {
          const msg = orderMessageSubjects?.find(m => m.ordernumber === order.ordernumber);
          if (msg) {
            const key = `${msg.subject}-${order.customername}-${order.city}`;
            
            if (!groupedMessages.has(key)) {
              groupedMessages.set(key, {
                subject: msg.subject,
                customername: order.customername,
                city: order.city,
                relatedItems: []
              });
            }
            
            const group = groupedMessages.get(key)!;
            group.relatedItems.push({
              type: 'order',
              id: order.ordernumber,
              customername: order.customername
            });
          }
        });
      }
      
      if (returnMessages && returnMessages.length > 0) {
        const returnNums = returnMessages.map(r => r.returnnumber);
        const { data: returnMessageSubjects, error: returnMsgError } = await supabase
          .from('messages')
          .select('subject, returnnumber, correctcustomer, city')
          .in('returnnumber', returnNums)
          .neq('subject', 'מחסן')
          .eq('is_handled', false)
          .order('created_at', { ascending: false });
          
        if (returnMsgError) throw returnMsgError;

        returnMessages.forEach(returnItem => {
          const msg = returnMessageSubjects?.find(m => m.returnnumber === returnItem.returnnumber);
          if (msg) {
            const key = `${msg.subject}-${returnItem.customername}-${returnItem.city}`;
            
            if (!groupedMessages.has(key)) {
              groupedMessages.set(key, {
                subject: msg.subject,
                customername: returnItem.customername,
                city: returnItem.city,
                relatedItems: []
              });
            }
            
            const group = groupedMessages.get(key)!;
            group.relatedItems.push({
              type: 'return',
              id: returnItem.returnnumber,
              customername: returnItem.customername
            });
          }
        });
      }

      // Convert to array and adjust relatedItems
      const result = Array.from(groupedMessages.values()).map(group => {
        // If there's only one item, don't show relatedItems
        // If there are multiple items, show all except the first as related items
        if (group.relatedItems.length <= 1) {
          const { relatedItems, ...messageWithoutRelated } = group;
          return messageWithoutRelated;
        } else {
          return {
            ...group,
            relatedItems: group.relatedItems.slice(1) // Show all except the first as related items
          };
        }
      });

      console.log('Customer messages with message_alert=true:', result);
      return result.filter(msg => msg.customername && msg.city);
    }
  });

  // 5. Fetch "order on another customer" details using standardized functions
  const { data: orderReplacements = [] } = useQuery({
    queryKey: ['order-replacements'],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('ordernumber, returnnumber, correctcustomer, city')
        .eq('subject', 'הזמנה על לקוח אחר')
        .not('correctcustomer', 'is', null);

      if (error) throw error;
      
      // Transform messages to include existsInSystem field
      const transformedMessages = (messages || []).map(msg => ({
        ...msg,
        existsInSystem: customerSupplyData.some(customer => 
          customer.customername === msg.correctcustomer
        )
      }));
      
      return transformedMessages;
    }
  });

  // Get customer replacement map using standardized function
  const customerReplacementMap = useMemo(() => {
    return getCustomerReplacementMap(orderReplacements, customerSupplyData);
  }, [orderReplacements, customerSupplyData]);

  // Fetch messages for orders and returns
  const { data: messageData = [] } = useQuery({
    queryKey: ['order-return-messages'],
    queryFn: async () => {
      console.log('Fetching order/return messages...');
      const { data, error } = await supabase
        .from('messages')
        .select('ordernumber, returnnumber, subject, content, tagagent, agentnumber, created_at')
        .or('ordernumber.not.is.null,returnnumber.not.is.null')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Order/return messages fetched:', data);
      return data;
    }
  });

  // Fetch agent names for tagged agents
  const { data: agentData = [] } = useQuery({
    queryKey: ['agents-for-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('agentnumber, agentname');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch cancellation messages specifically for red X overlay
  const { data: cancellationData = [] } = useQuery({
    queryKey: ['cancellation-messages'],
    queryFn: async () => {
      console.log('Fetching cancellation messages...');
      const { data, error } = await supabase
        .from('messages')
        .select('ordernumber, returnnumber')
        .eq('subject', 'לבטל הזמנה')
        .or('ordernumber.not.is.null,returnnumber.not.is.null');
      
      if (error) throw error;
      console.log('Cancellation messages fetched:', data);
      return data;
    }
  });

  // Fetch schedule messages - messages associated only with schedules
  const { data: scheduleMessages = [] } = useQuery({
    queryKey: ['schedule-messages'],
    queryFn: async () => {
      console.log('Fetching schedule messages...');
      const { data, error } = await supabase
        .from('messages')
        .select('schedule_id, subject, content, tagagent, agentnumber, created_at')
        .not('schedule_id', 'is', null)
        .is('ordernumber', null)
        .is('returnnumber', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('Schedule messages fetched:', data);
      return data;
    }
  });

  // Create agent name mapping
  const agentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    agentData.forEach(agent => {
      map[agent.agentnumber] = agent.agentname;
    });
    return map;
  }, [agentData]);

  // Create message mapping for quick lookup - support up to 2 messages per order/return
  const messageMap = useMemo(() => {
    const map: Record<string, Array<{ subject: string; content?: string; tagAgent?: string; agentName?: string }>> = {};
    
    messageData.forEach(msg => {
      const messageInfo = {
        subject: msg.subject,
        content: msg.content,
        tagAgent: msg.tagagent,
        agentName: msg.tagagent ? agentNameMap[msg.tagagent] : undefined
      };
      
      if (msg.ordernumber) {
        const key = `order-${msg.ordernumber}`;
        if (!map[key]) map[key] = [];
        map[key].push(messageInfo);
      }
      if (msg.returnnumber) {
        const key = `return-${msg.returnnumber}`;
        if (!map[key]) map[key] = [];
        map[key].push(messageInfo);
      }
    });
    
    // Keep only the 2 most recent messages for each order/return
    Object.keys(map).forEach(key => {
      map[key] = map[key].slice(0, 2);
    });
    
    return map;
  }, [messageData, agentNameMap]);

  // Create cancellation mapping for red X overlay
  const cancellationMap = useMemo(() => {
    const map: Set<string> = new Set();
    cancellationData.forEach(msg => {
      if (msg.ordernumber) {
        map.add(`order-${msg.ordernumber}`);
      }
      if (msg.returnnumber) {
        map.add(`return-${msg.returnnumber}`);
      }
    });
    return map;
  }, [cancellationData]);

  // Create schedule message mapping for quick lookup
  const scheduleMessageMap = useMemo(() => {
    const map: Record<string, { subject: string; content?: string; tagAgent?: string; agentName?: string }> = {};
    
    scheduleMessages.forEach(msg => {
      if (msg.schedule_id) {
        const messageInfo = {
          subject: msg.subject,
          content: msg.content,
          tagAgent: msg.tagagent,
          agentName: msg.tagagent ? agentNameMap[msg.tagagent] : undefined
        };
        
        map[`schedule-${msg.schedule_id}`] = messageInfo;
      }
    });
    
    return map;
  }, [scheduleMessages, agentNameMap]);

  // Update zone-schedule mapping when schedules change
  useEffect(() => {
    console.log('Updating zone-schedule mapping based on schedules:', distributionSchedules);
    
    const newMapping: Record<number, number | null> = {};
    
    // First, preserve existing mappings that still have valid schedules
    Object.entries(zoneScheduleMapping).forEach(([zoneStr, scheduleId]) => {
      const zoneNumber = parseInt(zoneStr);
      if (scheduleId && distributionSchedules.some(s => s.schedule_id === scheduleId)) {
        newMapping[zoneNumber] = scheduleId;
      }
    });
    
    // Then assign unassigned schedules to zones without schedules
    const assignedScheduleIds = new Set(Object.values(newMapping).filter(Boolean));
    const unassignedSchedules = distributionSchedules
      .filter(schedule => !assignedScheduleIds.has(schedule.schedule_id))
      .sort((a, b) => a.schedule_id - b.schedule_id);
    
    // Find zones without schedules and assign them
    for (let zone = 1; zone <= 12; zone++) {
      if (!newMapping[zone] && unassignedSchedules.length > 0) {
        const schedule = unassignedSchedules.shift();
        if (schedule) {
          newMapping[zone] = schedule.schedule_id;
        }
      }
    }
    
    // Ensure all zones exist in mapping (even if null)
    for (let zone = 1; zone <= 12; zone++) {
      if (!(zone in newMapping)) {
        newMapping[zone] = null;
      }
    }
    
    console.log('New zone-schedule mapping:', newMapping);
    setZoneScheduleMapping(newMapping);
  }, [distributionSchedules]);

  const handleDrop = async (zoneNumber: number, item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('handleDrop called with zoneNumber:', zoneNumber, 'item:', item);

      // Get the schedule ID for this zone from our mapping
      const scheduleId = zoneScheduleMapping[zoneNumber];
      if (!scheduleId) {
        console.log('No schedule ID found for zone, cannot drop item');
        return;
      }
      
      console.log('Using schedule ID from mapping:', scheduleId);
      
      if (item.type === 'order') {
        console.log('Updating order', (item.data as Order).ordernumber, 'with schedule_id:', scheduleId);
        const {
          error
        } = await supabase.from('mainorder').update({
          schedule_id: scheduleId
        }).eq('ordernumber', (item.data as Order).ordernumber);
        if (error) {
          console.error('Error updating order:', error);
          throw error;
        }
        console.log('Order updated successfully');
        refetchOrders();
      } else {
        console.log('Updating return', (item.data as Return).returnnumber, 'with schedule_id:', scheduleId);
        const {
          error
        } = await supabase.from('mainreturns').update({
          schedule_id: scheduleId
        }).eq('returnnumber', (item.data as Return).returnnumber);
        if (error) {
          console.error('Error updating return:', error);
          throw error;
        }
        console.log('Return updated successfully');
        refetchReturns();
      }

      // Refresh schedules after assignment
      refetchSchedules();
    } catch (error) {
      console.error('Error updating distribution:', error);
    }
  };
  const handleDropToUnassigned = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('Removing item from assignment:', item);
      if (item.type === 'order') {
        const {
          error
        } = await supabase.from('mainorder').update({
          schedule_id: null
        }).eq('ordernumber', (item.data as Order).ordernumber);
        if (error) {
          console.error('Error removing order assignment:', error);
          throw error;
        }
        console.log('Order assignment removed successfully');
        refetchOrders();
      } else {
        const {
          error
        } = await supabase.from('mainreturns').update({
          schedule_id: null
        }).eq('returnnumber', (item.data as Return).returnnumber);
        if (error) {
          console.error('Error removing return assignment:', error);
          throw error;
        }
        console.log('Return assignment removed successfully');
        refetchReturns();
      }

      // Refresh schedules after removal
      refetchSchedules();
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };
  const handleScheduleDeleted = () => {
    console.log('Schedule deleted, refreshing all data...');
    refetchOrders();
    refetchReturns();
    refetchSchedules();
  };

  const handleScheduleCreated = (zoneNumber: number, newScheduleId: number) => {
    console.log('Schedule created for zone', zoneNumber, 'with ID:', newScheduleId);
    
    // Update the zone-schedule mapping immediately
    setZoneScheduleMapping(prev => ({
      ...prev,
      [zoneNumber]: newScheduleId
    }));
    
    refetchSchedules();
  };

  const handleRemoveFromZone = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    await handleDropToUnassigned(item);
  };
  const handleDeleteItem = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('Deleting item:', item);
      if (item.type === 'order') {
        const {
          error
        } = await supabase.from('mainorder').update({
          ordercancel: new Date().toISOString()
        }).eq('ordernumber', (item.data as Order).ordernumber);
        if (error) {
          console.error('Error deleting order:', error);
          throw error;
        }
        console.log('Order deleted successfully');
        toast({
          title: "הזמנה נמחקה",
          description: `הזמנה #${(item.data as Order).ordernumber} הועברה לארכיון`
        });
        refetchOrders();
      } else {
        const {
          error
        } = await supabase.from('mainreturns').update({
          returncancel: new Date().toISOString()
        }).eq('returnnumber', (item.data as Return).returnnumber);
        if (error) {
          console.error('Error deleting return:', error);
          throw error;
        }
        console.log('Return deleted successfully');
        toast({
          title: "החזרה נמחקה",
          description: `החזרה #${(item.data as Return).returnnumber} הועברה לארכיון`
        });
        refetchReturns();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הפריט",
        variant: "destructive"
      });
    }
  };

  // Updated helper function to get the current state of a zone using stable mapping
  const getZoneState = (zoneNumber: number) => {
    console.log('getZoneState called for zone:', zoneNumber);
    console.log('Current zone-schedule mapping:', zoneScheduleMapping);

    const scheduleId = zoneScheduleMapping[zoneNumber];
    
    if (!scheduleId) {
      console.log(`Zone ${zoneNumber} has no schedule - completely empty`);
      return {
        selectedGroupId: null,
        scheduleId: null,
        isPinned: false
      };
    }

    // Find the schedule details
    const schedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
    if (!schedule) {
      console.log(`Schedule ${scheduleId} not found for zone ${zoneNumber}`);
      return {
        selectedGroupId: null,
        scheduleId: null,
        isPinned: false
      };
    }

    console.log(`Zone ${zoneNumber} mapped to schedule:`, schedule);
    return {
      selectedGroupId: schedule.groups_id,
      scheduleId: schedule.schedule_id,
      isPinned: schedule.isPinned || false
    };
  };

  // Add toggle pin handler
  const handleTogglePin = async (zoneNumber: number) => {
    const scheduleId = zoneScheduleMapping[zoneNumber];
    if (!scheduleId) {
      console.log('No schedule ID found for zone, cannot toggle pin');
      return;
    }

    try {
      const currentSchedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
      const newPinnedStatus = !(currentSchedule?.isPinned || false);
      
      console.log(`Toggling pin for zone ${zoneNumber}, schedule ${scheduleId}:`, newPinnedStatus);
      
      const { error } = await supabase
        .from('distribution_schedule')
        .update({ isPinned: newPinnedStatus })
        .eq('schedule_id', scheduleId);
      
      if (error) {
        console.error('Error updating pin status:', error);
        throw error;
      }
      
      console.log('Pin status updated successfully');
      refetchSchedules();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הצימוד",
        variant: "destructive"
      });
    }
  };

  // Add siren toggle handler
  const handleSirenToggle = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      const newAlertStatus = !item.data.alert_status;
      console.log(`Toggling siren for ${item.type}:`, item.data, 'New status:', newAlertStatus);
      
      if (item.type === 'order') {
        const { error } = await supabase
          .from('mainorder')
          .update({ alert_status: newAlertStatus })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error updating order alert status:', error);
          throw error;
        }
        console.log('Order alert status updated successfully');
        refetchOrders();
      } else {
        const { error } = await supabase
          .from('mainreturns')
          .update({ alert_status: newAlertStatus })
          .eq('returnnumber', (item.data as Return).returnnumber);
        
        if (error) {
          console.error('Error updating return alert status:', error);
          throw error;
        }
        console.log('Return alert status updated successfully');
        refetchReturns();
      }
    } catch (error) {
      console.error('Error toggling siren:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון ההתראה",
        variant: "destructive"
      });
    }
  };

  // Handle message badge click
  const handleMessageBadgeClick = async (item: {
    type: 'order' | 'return';
    data: Order | Return;
  }) => {
    try {
      console.log('Message badge clicked for item:', item);
      
      if (item.type === 'order') {
        const currentAlert = (item.data as Order).message_alert;
        const { error } = await supabase
          .from('mainorder')
          .update({ message_alert: !currentAlert })
          .eq('ordernumber', (item.data as Order).ordernumber);
        
        if (error) {
          console.error('Error updating order message_alert:', error);
          return;
        }
        
        refetchOrders();
      } else {
        const currentAlert = (item.data as Return).message_alert;
        const { error } = await supabase
          .from('mainreturns')
          .update({ message_alert: !currentAlert })
          .eq('returnnumber', (item.data as Return).returnnumber);
        
        if (error) {
          console.error('Error updating return message_alert:', error);
          return;
        }
        
        refetchReturns();
      }
      
      console.log('Message alert status updated successfully');
    } catch (error) {
      console.error('Error updating message alert:', error);
    }
  };

  // Handle schedule important message badge click
  const handleScheduleImportantMessageClick = async (scheduleId: number) => {
    try {
      console.log('Schedule important message clicked for schedule:', scheduleId);
      
      // Toggle message_alert in distribution_schedule
      const currentSchedule = distributionSchedules.find(s => s.schedule_id === scheduleId);
      const currentAlert = currentSchedule?.message_alert;
      
      const { error } = await supabase
        .from('distribution_schedule')
        .update({ message_alert: !currentAlert })
        .eq('schedule_id', scheduleId);
      
      if (error) {
        console.error('Error updating schedule message_alert:', error);
        return;
      }
      
      refetchSchedules();
      console.log('Schedule message alert status updated successfully');
    } catch (error) {
      console.error('Error updating schedule message alert:', error);
    }
  };

  // Filter unassigned items (those without schedule_id or with schedule_id pointing to produced schedules)
  const baseUnassignedOrders = orders.filter(order => !order.schedule_id || !distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id));
  const baseUnassignedReturns = returns.filter(returnItem => !returnItem.schedule_id || !distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id));
  
  // For agent 99, filter to show only their unassigned orders/returns
  const unassignedOrders = currentUser?.agentnumber === "99" 
    ? baseUnassignedOrders.filter(order => order.agentnumber === "99")
    : baseUnassignedOrders;
  const unassignedReturns = currentUser?.agentnumber === "99"
    ? baseUnassignedReturns.filter(returnItem => returnItem.agentnumber === "99") 
    : baseUnassignedReturns;

  // Create sorted drop zones (pinned first, then regular order)
  const dropZones = useMemo(() => {
    const allZones = Array.from({ length: 12 }, (_, index) => index + 1);
    
    return allZones.sort((a, b) => {
      const zoneStateA = getZoneState(a);
      const zoneStateB = getZoneState(b);
      const pinnedA = zoneStateA.isPinned;
      const pinnedB = zoneStateB.isPinned;
      
      // If one is pinned and the other isn't, pinned comes first
      if (pinnedA && !pinnedB) return -1;
      if (!pinnedA && pinnedB) return 1;
      
      // If both have the same pinned status, maintain numerical order
      return a - b;
    });
  }, [distributionSchedules, zoneScheduleMapping]);

  console.log('Unassigned orders:', unassignedOrders.length);
  console.log('Unassigned returns:', unassignedReturns.length);
  console.log('Distribution groups:', distributionGroups.length);
  console.log('Active schedules:', distributionSchedules.length);
  console.log('Sorted drop zones:', dropZones);
  const isLoading = ordersLoading || returnsLoading || groupsLoading || schedulesLoading || driversLoading || customerSupplyLoading;

  // Check if there are any items with active sirens anywhere in the system
  const hasGlobalActiveSiren = useMemo(() => {
    // Check unassigned items
    const unassignedHasSiren = [
      ...unassignedOrders.filter(order => order.alert_status),
      ...unassignedReturns.filter(returnItem => returnItem.alert_status)
    ].length > 0;

    // Check items in zones (assigned to active schedules)
    const assignedHasSiren = [
      ...orders.filter(order => 
        order.schedule_id && 
        distributionSchedules.some(schedule => schedule.schedule_id === order.schedule_id) &&
        order.alert_status
      ),
      ...returns.filter(returnItem => 
        returnItem.schedule_id && 
        distributionSchedules.some(schedule => schedule.schedule_id === returnItem.schedule_id) &&
        returnItem.alert_status
      )
    ].length > 0;

    return unassignedHasSiren || assignedHasSiren;
  }, [unassignedOrders, unassignedReturns, orders, returns, distributionSchedules]);

  // Check if there are any schedule messages with important alerts
  const hasScheduleImportantMessages = useMemo(() => {
    return distributionSchedules.some(schedule => 
      schedule.message_alert && scheduleMessageMap[`schedule-${schedule.schedule_id}`]
    );
  }, [distributionSchedules, scheduleMessageMap]);

  // Periodic refresh for horizontal kanban every minute
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isLoading) {
        console.log('Refreshing horizontal kanban data...');
        refetchOrders();
        refetchReturns();
        refetchSchedules();
      }
    }, 60000); // 1 minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, [refetchOrders, refetchReturns, refetchSchedules, isLoading]);

  if (isLoading) {
    return <div className="min-h-screen p-6 bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>;
  }
  return (
      <div className="min-h-screen p-6 bg-[#52a0e4]/15">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-700">ממשק הפצה</h1>
            {hasScheduleImportantMessages && (
              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full border border-purple-300">
                יש הודעות חשובות בלוחות זמנים
              </span>
            )}
            <CustomerMessageBanner messages={customerMessages} />
          </div>
          <CentralAlertBanner isVisible={hasGlobalActiveSiren} />
        </div>
        
        {/* Warehouse message banner - only for user 4 */}
        {currentUser?.agentnumber === "4" && (
          <div className="mb-6">
            <WarehouseMessageBanner messages={warehouseMessages} />
          </div>
        )}
        
        {/* Unassigned items area without alert banner */}
        <UnassignedArea 
          unassignedOrders={unassignedOrders} 
          unassignedReturns={unassignedReturns} 
          onDragStart={setDraggedItem} 
          onDropToUnassigned={handleDropToUnassigned} 
          onDeleteItem={handleDeleteItem}
          multiOrderActiveCustomerList={multiOrderActiveCustomerList}
          dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
          customerSupplyMap={customerSupplyMap}
          customerCoordinatesMap={customerCoordinatesMap}
          onSirenToggle={handleSirenToggle}
          messageMap={messageMap}
          onMessageBadgeClick={handleMessageBadgeClick}
          cancellationMap={cancellationMap}
          customerReplacementMap={customerReplacementMap}
        />

        {/* Mobile: single column, Tablet: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dropZones.map(zoneNumber => 
            <DropZone 
              key={zoneNumber} 
              zoneNumber={zoneNumber} 
              distributionGroups={filteredDistributionGroups} 
              distributionSchedules={distributionSchedules} 
              drivers={drivers} 
              onDrop={handleDrop}
              orders={orders}
              returns={returns}
              onScheduleDeleted={handleScheduleDeleted}
              onScheduleCreated={handleScheduleCreated}
              onRemoveFromZone={handleRemoveFromZone}
              getZoneState={getZoneState}
              multiOrderActiveCustomerList={multiOrderActiveCustomerList}
              dualActiveOrderReturnCustomers={dualActiveOrderReturnCustomers}
              customerSupplyMap={customerSupplyMap}
              customerCoordinatesMap={customerCoordinatesMap}
              onSirenToggle={handleSirenToggle}
              onTogglePin={handleTogglePin}
              messageMap={messageMap}
              onMessageBadgeClick={handleMessageBadgeClick}
              cancellationMap={cancellationMap}
              customerReplacementMap={customerReplacementMap}
              scheduleMessageMap={scheduleMessageMap}
              onScheduleImportantMessageClick={handleScheduleImportantMessageClick}
            />
          )}
        </div>
      </div>
    );
};

export default Distribution;
