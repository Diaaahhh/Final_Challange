// useTableSuggestion.js
import { useState, useEffect } from 'react';

export default function useTableSuggestion(guestCount, availableTables) {
  
  // --- UI DISPLAY FIX ---
  // Sort the actual array passed by the component so the UI renders tables 
  // in perfect numerical order (e.g., 60, 70, 80) instead of Database ID order.
  if (availableTables && availableTables.length > 0) {
    availableTables.sort((a, b) => parseInt(a.table_no, 10) - parseInt(b.table_no, 10));
  }

  const [suggestedTables, setSuggestedTables] = useState([]);

  useEffect(() => {
    // Parse guest count safely
    const guests = parseInt(guestCount, 10);
    
    // If no guests, invalid number, or no tables available, clear suggestions
    if (!guests || guests <= 0 || !availableTables || availableTables.length === 0) {
      setSuggestedTables([]);
      return;
    }

    // Filter out occupied tables into a new array for calculation
    let available = availableTables.filter(t => !t.is_occupied);
    if (available.length === 0) {
        setSuggestedTables([]);
        return;
    }

    // Sort available tables primarily by capacity (smallest to largest) to find the math "best fit".
    // Secondarily parse varchar table_no into INT to sort tied capacities.
    available.sort((a, b) => {
      const capA = a.person_no || a.capacity || 4;
      const capB = b.person_no || b.capacity || 4;
      
      if (capA !== capB) return capA - capB; // Sort by capacity first
      
      // If capacities are equal, sort strictly by parsed integer table number
      return parseInt(a.table_no, 10) - parseInt(b.table_no, 10);
    });

    let remainingGuests = guests;
    const combinedSuggestion = [];

    // Loop until all guests have a seat OR we run out of tables
    while (remainingGuests > 0 && available.length > 0) {
      
      // 1. Find the smallest table that can fit the REMAINING guests
      const bestFitIndex = available.findIndex(t => (t.person_no || t.capacity || 4) >= remainingGuests);

      if (bestFitIndex !== -1) {
        // Found a table that fits the rest of the guests perfectly!
        const table = available[bestFitIndex];
        combinedSuggestion.push(table.table_no);
        remainingGuests -= (table.person_no || table.capacity || 4);
        
        // Remove it from available tables so we don't pick it again
        available.splice(bestFitIndex, 1); 
        break; // All guests accommodated, exit loop
        
      } else {
        // 2. No single table is big enough for the remaining guests.
        // Take the absolute largest available table (which is the last one in our sorted array).
        const largestTable = available[available.length - 1]; 
        combinedSuggestion.push(largestTable.table_no);
        remainingGuests -= (largestTable.person_no || largestTable.capacity || 4);
        
        // Remove the largest table from available array
        available.pop(); 
      }
    }

    // Finally, explicitly parse the final suggested table numbers into Integers 
    // so they are returned in perfect numerical order (e.g., 1, 2, 10, 12)
    combinedSuggestion.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    setSuggestedTables(combinedSuggestion);
  }, [guestCount, availableTables]);

  return suggestedTables;
}