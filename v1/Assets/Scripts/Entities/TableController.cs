using UnityEngine;

// Controls a table where customers sit and orders are delivered
public class TableController : MonoBehaviour
{
    [Header("Table Configuration")]
    public int TableIndex = 0;  // Unique ID for this table
    public bool IsOccupied = false;
    
    [Header("Visuals")]
    public SpriteRenderer tableSprite;
    public GameObject highlightVisual;
    public GameObject tableNumberVisual;
    public TMPro.TextMeshPro tableNumberText;
    
    [Header("Customer Position")]
    public Transform customerSeatPosition;
    
    // References
    private CustomerController currentCustomer;
    
    void Start()
    {
        // Set up table number visual
        if (tableNumberText != null)
        {
            tableNumberText.text = (TableIndex + 1).ToString();  // Display 1-based index to player
        }
        
        // Hide highlight initially
        if (highlightVisual != null)
        {
            highlightVisual.SetActive(false);
        }
    }
    
    // Called by LevelManager to seat a customer at this table
    public bool SeatCustomer(CustomerController customer)
    {
        if (IsOccupied || customer == null)
        {
            return false;
        }
        
        // Assign this table to the customer
        Vector3 seatPosition = customerSeatPosition != null ? 
                              customerSeatPosition.position : 
                              transform.position;
        
        customer.AssignTable(TableIndex, seatPosition);
        
        // Mark table as occupied
        IsOccupied = true;
        currentCustomer = customer;
        
        return true;
    }
    
    // Called when a customer leaves the table
    public void CustomerLeft()
    {
        IsOccupied = false;
        currentCustomer = null;
        
        // Could add additional cleanup or reset visuals
    }
    
    // Highlight this table (e.g., when it's the target for the current order)
    public void SetHighlighted(bool highlighted)
    {
        if (highlightVisual != null)
        {
            highlightVisual.SetActive(highlighted);
        }
        
        // Could also change the table sprite color
        if (tableSprite != null)
        {
            tableSprite.color = highlighted ? Color.yellow : Color.white;
        }
    }
    
    // Check if table is valid for delivery (has a customer in ordering state)
    public bool IsValidForDelivery()
    {
        return IsOccupied && 
               currentCustomer != null && 
               currentCustomer.State == CustomerState.Ordering;
    }
    
    // Get current customer at this table
    public CustomerController GetCurrentCustomer()
    {
        return currentCustomer;
    }
}
