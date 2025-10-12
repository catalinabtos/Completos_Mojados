using UnityEngine;
using System.Collections;
using System.Collections.Generic;

// Represents a food order in the game
[System.Serializable]
public class Order
{
    // List of ingredients in the order
    public List<string> ingredients = new List<string>();
    
    // Optional beverage
    public string beverage;
    
    // Table ID for this order
    public int tableId;
    
    // Flag to mark if order is ready
    public bool isReady = false;
    
    // Add an ingredient to the order
    public void AddIngredient(string ingredient)
    {
        if (!string.IsNullOrEmpty(ingredient) && !ingredients.Contains(ingredient))
        {
            ingredients.Add(ingredient);
        }
    }
    
    // Add a beverage to the order
    public void AddBeverage(string beverageType)
    {
        beverage = beverageType;
    }
    
    // Check if this order matches another order exactly
    public bool MatchesExactly(Order other)
    {
        // Check if table IDs match
        if (tableId != other.tableId)
        {
            return false;
        }
        
        // Check if ingredient counts match
        if (ingredients.Count != other.ingredients.Count)
        {
            return false;
        }
        
        // Check if all ingredients match (order doesn't matter)
        foreach (string ingredient in ingredients)
        {
            if (!other.ingredients.Contains(ingredient))
            {
                return false;
            }
        }
        
        // Check if beverages match
        if (!string.IsNullOrEmpty(beverage) != !string.IsNullOrEmpty(other.beverage))
        {
            return false;
        }
        
        if (!string.IsNullOrEmpty(beverage) && beverage != other.beverage)
        {
            return false;
        }
        
        // If all checks pass, the orders match
        return true;
    }
    
    // Calculate match quality percentage (how close the order is to what was ordered)
    public float MatchQuality(Order expected)
    {
        if (expected == null || expected.ingredients.Count == 0)
        {
            return 0f;
        }
        
        // Start with 100% match
        float matchPercent = 1.0f;
        
        // Missing ingredients penalize by 10% each
        foreach (string ingredient in expected.ingredients)
        {
            if (!ingredients.Contains(ingredient))
            {
                matchPercent -= 0.1f;
            }
        }
        
        // Extra ingredients penalize by 10% each
        foreach (string ingredient in ingredients)
        {
            if (!expected.ingredients.Contains(ingredient))
            {
                matchPercent -= 0.1f;
            }
        }
        
        // Wrong or missing beverage penalizes by 10%
        if (!string.IsNullOrEmpty(expected.beverage))
        {
            if (string.IsNullOrEmpty(beverage) || beverage != expected.beverage)
            {
                matchPercent -= 0.1f;
            }
        }
        else if (!string.IsNullOrEmpty(beverage))
        {
            // Customer didn't want a beverage but got one anyway
            matchPercent -= 0.1f;
        }
        
        // Clamp the result between 0 and 1
        return Mathf.Clamp01(matchPercent);
    }
    
    // Check if the order is valid (has at least base ingredients)
    public bool IsValid()
    {
        // A valid order must have at least pan and salchicha
        return ingredients.Contains("pan") && ingredients.Contains("salchicha");
    }
    
    // Clear the order
    public void Clear()
    {
        ingredients.Clear();
        beverage = null;
        isReady = false;
    }
    
    // Get a string representation of the order
    public override string ToString()
    {
        string result = "Completo: ";
        foreach (string ingredient in ingredients)
        {
            result += ingredient + ", ";
        }
        
        if (!string.IsNullOrEmpty(beverage))
        {
            result += "Bebida: " + beverage;
        }
        
        return result;
    }
    
    // Create a copy of this order
    public Order Clone()
    {
        Order clone = new Order();
        clone.tableId = this.tableId;
        clone.isReady = this.isReady;
        
        // Copy ingredients
        foreach (string ingredient in ingredients)
        {
            clone.ingredients.Add(ingredient);
        }
        
        // Copy beverage
        clone.beverage = this.beverage;
        
        return clone;
    }
}
