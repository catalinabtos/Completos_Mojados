using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;

// Controls customer behavior and state
public class CustomerController : MonoBehaviour
{
    [Header("Customer Settings")]
    public float basePatience = 18f;  // Default patience time in seconds
    public float moveSpeed = 2f;       // Movement speed
    
    [Header("UI Elements")]
    public GameObject orderBubble;     // Speech bubble showing the order
    public Image patienceBar;          // Bar showing remaining patience
    public Transform orderContentParent; // Parent transform for order icons
    
    [Header("Visuals")]
    public SpriteRenderer customerSprite;
    public Sprite[] customerVariants;  // Different customer appearances
    public Color happyColor = Color.green;
    public Color mediumColor = Color.yellow;
    public Color angryColor = Color.red;
    
    // Properties
    public CustomerState State { get; private set; }
    public int QueuePosition { get; set; }
    public int TablePosition { get; set; }
    public Order CurrentOrder { get; private set; }
    
    // Internal variables
    private float currentPatience;
    private float maxPatience;
    private Transform targetPosition;
    private Dictionary<string, float> orderProbabilities;
    private bool isMoving = false;
    private Vector3 moveTarget;
    
    public void Initialize(float patienceTime, Dictionary<string, float> orderDistribution)
    {
        // Set initial state
        State = CustomerState.Arriving;
        maxPatience = patienceTime;
        currentPatience = maxPatience;
        orderProbabilities = orderDistribution;
        
        // Set random appearance
        if (customerVariants != null && customerVariants.Length > 0 && customerSprite != null)
        {
            int variantIndex = Random.Range(0, customerVariants.Length);
            customerSprite.sprite = customerVariants[variantIndex];
        }
        
        // Hide order bubble initially
        if (orderBubble != null)
        {
            orderBubble.SetActive(false);
        }
        
        // Start the customer state machine
        StartCoroutine(CustomerStateMachine());
    }
    
    void Update()
    {
        // Handle movement
        if (isMoving && moveTarget != null)
        {
            transform.position = Vector3.MoveTowards(transform.position, moveTarget, moveSpeed * Time.deltaTime);
            
            // Check if we've reached the destination
            if (Vector3.Distance(transform.position, moveTarget) < 0.1f)
            {
                isMoving = false;
            }
        }
        
        // Update patience bar when in appropriate states
        if (State == CustomerState.Waiting || State == CustomerState.Seated || State == CustomerState.Ordering)
        {
            UpdatePatience();
        }
    }
    
    private IEnumerator CustomerStateMachine()
    {
        // ARRIVING state - initial entry point
        // Wait briefly before entering queue
        yield return new WaitForSeconds(0.5f);
        
        // WAITING state - in queue
        TransitionToState(CustomerState.Waiting);
        
        // Wait until we get assigned a table
        while (State == CustomerState.Waiting)
        {
            yield return null;
        }
        
        // SEATED state - move to assigned table
        if (State == CustomerState.Seated)
        {
            // Wait briefly after being seated
            yield return new WaitForSeconds(1f);
            
            // ORDERING state - show order bubble
            TransitionToState(CustomerState.Ordering);
            GenerateOrder();
            ShowOrderBubble(true);
            
            // Wait until order is delivered or patience runs out
            while (State == CustomerState.Ordering)
            {
                if (currentPatience <= 0)
                {
                    TransitionToState(CustomerState.AngryLeaving);
                    break;
                }
                yield return null;
            }
            
            // If the order was delivered, enter EATING state
            if (State == CustomerState.Eating)
            {
                ShowOrderBubble(false);
                
                // Eat for a few seconds
                yield return new WaitForSeconds(Random.Range(3f, 5f));
                
                // Then leave
                TransitionToState(CustomerState.Leaving);
            }
        }
        
        // LEAVING or ANGRY_LEAVING - exit the restaurant
        if (State == CustomerState.Leaving || State == CustomerState.AngryLeaving)
        {
            // Move to exit position (offscreen)
            moveTarget = new Vector3(-10f, transform.position.y, transform.position.z);
            isMoving = true;
            
            // Wait until we're offscreen
            yield return new WaitUntil(() => !isMoving || transform.position.x < -9f);
            
            // Notify level manager if this was an angry departure
            if (State == CustomerState.AngryLeaving)
            {
                LevelManager levelManager = FindObjectOfType<LevelManager>();
                if (levelManager != null)
                {
                    levelManager.CustomerAbandoned();
                }
            }
            
            // Destroy the customer object
            Destroy(gameObject);
        }
    }
    
    private void TransitionToState(CustomerState newState)
    {
        State = newState;
        
        // Handle state-specific transitions
        switch (newState)
        {
            case CustomerState.Waiting:
                // Reset patience when entering queue
                currentPatience = maxPatience;
                break;
                
            case CustomerState.Seated:
                // Reset patience when seated at a table
                currentPatience = maxPatience;
                break;
                
            case CustomerState.AngryLeaving:
                // Show angry visual cue
                ShowOrderBubble(false);
                if (customerSprite != null)
                {
                    customerSprite.color = angryColor;
                }
                break;
        }
    }
    
    private void UpdatePatience()
    {
        // Decrease patience over time
        currentPatience -= Time.deltaTime;
        
        // Update the patience bar UI
        if (patienceBar != null)
        {
            patienceBar.fillAmount = Mathf.Clamp01(currentPatience / maxPatience);
            
            // Update bar color based on patience level
            float patiencePercent = currentPatience / maxPatience;
            if (patiencePercent > 0.6f)
            {
                patienceBar.color = happyColor;
            }
            else if (patiencePercent > 0.3f)
            {
                patienceBar.color = mediumColor;
            }
            else
            {
                patienceBar.color = angryColor;
            }
        }
        
        // Check if patience has run out
        if (currentPatience <= 0 && State != CustomerState.AngryLeaving)
        {
            TransitionToState(CustomerState.AngryLeaving);
        }
    }
    
    private void GenerateOrder()
    {
        // Create new order based on level-specific probabilities
        CurrentOrder = new Order();
        
        // Always add base ingredients (pan, salchicha)
        CurrentOrder.AddIngredient("pan");
        CurrentOrder.AddIngredient("salchicha");
        
        // Determine completo type based on probabilities
        string completo = SelectCompletoType();
        
        // Add ingredients based on completo type
        switch (completo)
        {
            case "italiano":
                CurrentOrder.AddIngredient("palta");
                CurrentOrder.AddIngredient("tomate");
                CurrentOrder.AddIngredient("mayo");
                break;
                
            case "dinamico":
                CurrentOrder.AddIngredient("tomate");
                CurrentOrder.AddIngredient("americana");
                CurrentOrder.AddIngredient("mayo");
                CurrentOrder.AddIngredient("salsa_verde");
                break;
                
            // Add more completo types as needed
        }
        
        // Add random beverage (70% chance)
        if (Random.value < 0.7f)
        {
            string[] beverages = { "lata", "cola", "limon", "naranja" };
            int beverageIndex = Random.Range(0, beverages.Length);
            CurrentOrder.AddBeverage(beverages[beverageIndex]);
        }
        
        // Assign a table ID to this order
        CurrentOrder.tableId = TablePosition;
    }
    
    private string SelectCompletoType()
    {
        // Default to italiano if no distribution is defined
        if (orderProbabilities == null || orderProbabilities.Count == 0)
        {
            return "italiano";
        }
        
        // Calculate total probability weight
        float total = 0f;
        foreach (var prob in orderProbabilities.Values)
        {
            total += prob;
        }
        
        // Normalize if not 1.0
        float normalizer = (total > 0) ? 1f / total : 1f;
        
        // Select based on random value
        float random = Random.value;
        float cumulative = 0f;
        
        foreach (var kvp in orderProbabilities)
        {
            cumulative += kvp.Value * normalizer;
            if (random <= cumulative)
            {
                return kvp.Key;
            }
        }
        
        // Fallback
        return orderProbabilities.Keys.GetEnumerator().Current;
    }
    
    private void ShowOrderBubble(bool show)
    {
        if (orderBubble != null)
        {
            orderBubble.SetActive(show);
        }
        
        // If showing the bubble, populate it with order items
        if (show && CurrentOrder != null && orderContentParent != null)
        {
            // Clear previous content
            foreach (Transform child in orderContentParent)
            {
                Destroy(child.gameObject);
            }
            
            // Add icons for each ingredient (would need to implement)
            DisplayOrderIngredients();
        }
    }
    
    private void DisplayOrderIngredients()
    {
        // This method would create and position icons for each ingredient in the order
        // Implementation would depend on UI layout and available sprites
        Debug.Log("Customer " + gameObject.GetInstanceID() + " is ordering: " + CurrentOrder.ToString());
    }
    
    public void AssignTable(int tableIndex, Vector3 tablePosition)
    {
        TablePosition = tableIndex;
        moveTarget = tablePosition;
        isMoving = true;
        TransitionToState(CustomerState.Seated);
    }
    
    public void DeliverOrder(Order deliveredOrder)
    {
        // Check if order matches what the customer wanted
        bool isPerfect = CurrentOrder.MatchesExactly(deliveredOrder);
        
        // Calculate order value based on match quality and remaining patience
        float baseValue = 10f;  // Base value for a perfect order
        float patienceBonus = currentPatience / maxPatience;  // 0 to 1 multiplier
        float matchPenalty = isPerfect ? 1f : 0.7f;  // Penalty for imperfect orders
        
        float finalValue = baseValue * patienceBonus * matchPenalty;
        
        // Transition to eating state
        TransitionToState(CustomerState.Eating);
        
        // Notify level manager about the completed order
        LevelManager levelManager = FindObjectOfType<LevelManager>();
        if (levelManager != null)
        {
            levelManager.ProcessOrderResult(isPerfect, finalValue, TablePosition);
        }
    }
}
