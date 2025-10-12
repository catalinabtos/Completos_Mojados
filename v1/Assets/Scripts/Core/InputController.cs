using UnityEngine;
using System.Collections;
using System.Collections.Generic;

// Controls player input and manages the current order being assembled
public class InputController : MonoBehaviour
{
    [Header("Order Assembly")]
    public Order currentOrder;
    public Transform deliveryPosition;
    public GameObject orderVisualPrefab;
    
    [Header("Drag & Drop Settings")]
    public float pickupOffset = 0.5f;
    public float snapDistance = 1.0f;
    public LayerMask customerLayer;
    public LayerMask tableLayer;
    
    // Internal variables
    private bool isDragging = false;
    private GameObject draggedVisual;
    private Vector3 dragStartPosition;
    private bool orderIsValid = false;
    private LevelManager levelManager;
    
    void Start()
    {
        levelManager = FindObjectOfType<LevelManager>();
        InitializeNewOrder();
    }
    
    void Update()
    {
        // Don't process input if game is paused
        if (GameManager.Instance.isPaused)
            return;
            
        // Handle order dragging
        if (isDragging && draggedVisual != null)
        {
            // Move the visual to follow the touch/mouse position
            Vector3 touchPos = GetTouchWorldPosition();
            draggedVisual.transform.position = touchPos + Vector3.up * pickupOffset;
            
            // Check for delivery to tables
            if (Input.GetMouseButtonUp(0))
            {
                // Try to deliver order to a customer
                TryDeliverOrder();
                
                // End drag regardless of delivery success
                EndDrag();
            }
        }
        else
        {
            // Start dragging on mouse/touch down on the delivery position
            if (Input.GetMouseButtonDown(0))
            {
                Vector3 touchPos = GetTouchWorldPosition();
                
                // Check if we're clicking on the assembled order
                if (Vector3.Distance(touchPos, deliveryPosition.position) < snapDistance)
                {
                    if (currentOrder != null && currentOrder.IsValid())
                    {
                        StartDrag();
                    }
                    else
                    {
                        Debug.Log("Order is not valid for delivery.");
                    }
                }
            }
        }
    }
    
    // Get the world position of the touch/mouse
    private Vector3 GetTouchWorldPosition()
    {
        Vector3 touchPos = Input.mousePosition;
        touchPos.z = 10; // Set distance from camera
        return Camera.main.ScreenToWorldPoint(touchPos);
    }
    
    // Start dragging the current order
    private void StartDrag()
    {
        if (currentOrder == null || !currentOrder.IsValid() || isDragging)
            return;
            
        isDragging = true;
        dragStartPosition = deliveryPosition.position;
        
        // Create a visual representation of the order
        if (orderVisualPrefab != null)
        {
            draggedVisual = Instantiate(orderVisualPrefab, dragStartPosition, Quaternion.identity);
            
            // Customize visual based on order contents
            OrderVisualController visualController = draggedVisual.GetComponent<OrderVisualController>();
            if (visualController != null)
            {
                visualController.DisplayOrder(currentOrder);
            }
        }
    }
    
    // End dragging the current order
    private void EndDrag()
    {
        isDragging = false;
        
        if (draggedVisual != null)
        {
            Destroy(draggedVisual);
            draggedVisual = null;
        }
    }
    
    // Try to deliver the order to a table/customer
    private void TryDeliverOrder()
    {
        if (currentOrder == null || !currentOrder.IsValid())
            return;
            
        Vector3 touchPos = GetTouchWorldPosition();
        
        // Raycast to find a customer
        RaycastHit2D hit = Physics2D.Raycast(touchPos, Vector2.zero, 0.1f, customerLayer);
        
        // If we hit a customer, try to deliver
        if (hit.collider != null)
        {
            CustomerController customer = hit.collider.GetComponent<CustomerController>();
            if (customer != null && customer.State == CustomerState.Ordering)
            {
                // Check if this is the correct table
                if (customer.TablePosition == currentOrder.tableId)
                {
                    // Deliver the order
                    customer.DeliverOrder(currentOrder);
                    
                    // Start a new order
                    InitializeNewOrder();
                    return;
                }
                else
                {
                    Debug.Log("Wrong table! Order is for table " + currentOrder.tableId);
                }
            }
        }
        
        // If we didn't hit a valid customer, check for tables
        hit = Physics2D.Raycast(touchPos, Vector2.zero, 0.1f, tableLayer);
        if (hit.collider != null)
        {
            // Get table index
            int tableIndex = hit.collider.GetComponent<TableController>()?.TableIndex ?? -1;
            
            if (tableIndex >= 0)
            {
                // Assign the table ID to the order
                currentOrder.tableId = tableIndex;
                
                // Place order at the table for later pickup
                // This would require additional game mechanics not implemented in this prototype
            }
        }
    }
    
    // Initialize a new empty order
    public void InitializeNewOrder()
    {
        currentOrder = new Order();
        currentOrder.tableId = -1;  // Not assigned to any table yet
        currentOrder.isReady = false;
        
        orderIsValid = false;
        
        // Update order visual if needed
    }
    
    // Add an ingredient to the current order
    public void AddIngredientToCurrentOrder(string ingredientName)
    {
        if (currentOrder == null)
        {
            InitializeNewOrder();
        }
        
        currentOrder.AddIngredient(ingredientName);
        
        // Check if order is now valid for delivery
        orderIsValid = currentOrder.IsValid();
        
        // Update order visual if needed
        
        Debug.Log("Added " + ingredientName + " to order");
    }
    
    // Add a beverage to the current order
    public void AddBeverageToCurrentOrder(string beverageName)
    {
        if (currentOrder == null)
        {
            InitializeNewOrder();
        }
        
        currentOrder.AddBeverage(beverageName);
        
        // Update order visual if needed
        
        Debug.Log("Added beverage " + beverageName + " to order");
    }
    
    // Discard the current order and start fresh
    public void DiscardCurrentOrder()
    {
        if (isDragging)
        {
            EndDrag();
        }
        
        InitializeNewOrder();
        
        Debug.Log("Discarded current order");
    }
    
    // Assign the current order to a specific table
    public void AssignOrderToTable(int tableId)
    {
        if (currentOrder != null)
        {
            currentOrder.tableId = tableId;
            
            // Update visual if needed to show table assignment
            
            Debug.Log("Order assigned to table " + tableId);
        }
    }
}

// Helper class to display order visuals
[System.Serializable]
public class OrderVisualController : MonoBehaviour
{
    public GameObject panVisual;
    public GameObject salchichaVisual;
    public GameObject[] toppingVisuals;
    public GameObject beverageVisual;
    
    // Display the order contents visually
    public void DisplayOrder(Order order)
    {
        if (order == null)
            return;
            
        // Show base ingredients
        if (panVisual != null) panVisual.SetActive(order.ingredients.Contains("pan"));
        if (salchichaVisual != null) salchichaVisual.SetActive(order.ingredients.Contains("salchicha"));
        
        // Show toppings (simplified for prototype)
        // In a full implementation, you would show specific toppings based on their names
        if (toppingVisuals != null && toppingVisuals.Length > 0)
        {
            for (int i = 0; i < toppingVisuals.Length; i++)
            {
                toppingVisuals[i].SetActive(false);
            }
            
            // Show toppings that are in the order
            int toppingIndex = 0;
            foreach (string ingredient in order.ingredients)
            {
                if (ingredient != "pan" && ingredient != "salchicha")
                {
                    if (toppingIndex < toppingVisuals.Length)
                    {
                        toppingVisuals[toppingIndex].SetActive(true);
                        toppingIndex++;
                    }
                }
            }
        }
        
        // Show beverage if present
        if (beverageVisual != null)
        {
            beverageVisual.SetActive(!string.IsNullOrEmpty(order.beverage));
        }
    }
}
