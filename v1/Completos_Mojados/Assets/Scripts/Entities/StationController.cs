using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.EventSystems;

// Controls a food preparation station
public class StationController : MonoBehaviour, IPointerClickHandler, IPointerDownHandler, IPointerUpHandler
{
    [Header("Station Configuration")]
    public StationType type;
    public int slots = 1;
    public float cooldownTime = 0f;  // Time before station can be used again
    
    [Header("Ingredients")]
    public List<string> availableIngredients;
    public GameObject[] ingredientPrefabs;  // Visual prefabs for each ingredient
    
    [Header("UI and Visuals")]
    public Transform[] itemPositions;  // Where ingredients are visually positioned
    public GameObject cooldownVisual;  // Visual indicator for cooldown
    
    // Internal variables
    private bool isInCooldown = false;
    private float cooldownRemaining = 0f;
    private List<string> currentItems = new List<string>();
    private InputController inputController;
    
    void Start()
    {
        // Find the input controller
        inputController = FindObjectOfType<InputController>();
        
        // Hide cooldown visual initially
        if (cooldownVisual != null)
        {
            cooldownVisual.SetActive(false);
        }
        
        // Initialize available ingredients based on station type
        if (availableIngredients == null || availableIngredients.Count == 0)
        {
            availableIngredients = GetDefaultIngredientsForType();
        }
    }
    
    void Update()
    {
        // Handle cooldown
        if (isInCooldown)
        {
            cooldownRemaining -= Time.deltaTime;
            
            // Update cooldown visual if present
            if (cooldownVisual != null)
            {
                // Could update a progress bar or other visual here
            }
            
            // Check if cooldown is complete
            if (cooldownRemaining <= 0f)
            {
                isInCooldown = false;
                cooldownRemaining = 0f;
                
                // Hide cooldown visual
                if (cooldownVisual != null)
                {
                    cooldownVisual.SetActive(false);
                }
            }
        }
    }
    
    // Gets called when player taps on this station
    public void OnPointerClick(PointerEventData eventData)
    {
        if (GameManager.Instance.isPaused || isInCooldown)
            return;
            
        // Handle click based on station type
        switch (type)
        {
            case StationType.Pan:
            case StationType.Salchicha:
                // Base ingredients are always added first to an empty order
                AddIngredientToOrder();
                break;
                
            case StationType.Toppings:
                // Select specific topping
                // For simplicity, just add first topping in this prototype
                if (availableIngredients.Count > 0)
                {
                    AddSpecificIngredient(availableIngredients[0]);
                }
                break;
                
            case StationType.Bebidas:
                // Add beverage to order
                if (availableIngredients.Count > 0)
                {
                    AddBeverageToOrder();
                }
                break;
                
            case StationType.Descarte:
                // Clear current order
                DiscardCurrentItem();
                break;
        }
    }
    
    // Gets called when player starts holding on this station
    public void OnPointerDown(PointerEventData eventData)
    {
        // For stations with hold-to-use mechanics
        if (type == StationType.Salchicha || type == StationType.Pan)
        {
            // Could start a "cooking" animation or progress bar
        }
    }
    
    // Gets called when player releases hold on this station
    public void OnPointerUp(PointerEventData eventData)
    {
        // For stations with hold-to-use mechanics
        if (type == StationType.Salchicha || type == StationType.Pan)
        {
            // Could finalize cooking if held long enough
        }
    }
    
    // Add the primary ingredient from this station to the current order
    private void AddIngredientToOrder()
    {
        if (inputController == null || isInCooldown || 
            availableIngredients == null || availableIngredients.Count == 0)
            return;
            
        // Get the first/main ingredient for this station
        string ingredient = availableIngredients[0];
        
        // Add it to the order being prepared
        inputController.AddIngredientToCurrentOrder(ingredient);
        
        // Start cooldown if applicable
        StartCooldown();
    }
    
    // Add a specific ingredient to the order
    private void AddSpecificIngredient(string ingredient)
    {
        if (inputController == null || isInCooldown)
            return;
            
        if (availableIngredients.Contains(ingredient))
        {
            inputController.AddIngredientToCurrentOrder(ingredient);
            StartCooldown();
        }
    }
    
    // Add a beverage to the order
    private void AddBeverageToOrder()
    {
        if (inputController == null || isInCooldown || 
            availableIngredients == null || availableIngredients.Count == 0)
            return;
            
        // Get the first/main beverage for this station
        string beverage = availableIngredients[0];
        
        // Add it to the order being prepared
        inputController.AddBeverageToCurrentOrder(beverage);
        
        // Start cooldown if applicable
        StartCooldown();
    }
    
    // Discard the current item being prepared
    private void DiscardCurrentItem()
    {
        if (inputController == null)
            return;
            
        inputController.DiscardCurrentOrder();
        
        // Start a short cooldown to prevent rapid discards
        cooldownTime = 0.5f;
        StartCooldown();
    }
    
    // Start the cooldown timer for this station
    private void StartCooldown()
    {
        if (cooldownTime > 0f)
        {
            isInCooldown = true;
            cooldownRemaining = cooldownTime;
            
            // Show cooldown visual
            if (cooldownVisual != null)
            {
                cooldownVisual.SetActive(true);
            }
        }
    }
    
    // Get default ingredients based on station type
    private List<string> GetDefaultIngredientsForType()
    {
        List<string> ingredients = new List<string>();
        
        switch (type)
        {
            case StationType.Pan:
                ingredients.Add("pan");
                break;
                
            case StationType.Salchicha:
                ingredients.Add("salchicha");
                break;
                
            case StationType.Toppings:
                // Add all toppings
                ingredients.AddRange(new string[] { 
                    "palta", "tomate", "mayo", "americana", 
                    "salsa_verde", "queso", "chucrut", "ketchup", 
                    "mostaza", "aji" 
                });
                break;
                
            case StationType.Bebidas:
                // Add all beverages
                ingredients.AddRange(new string[] { 
                    "lata", "cola", "limon", "naranja" 
                });
                break;
        }
        
        return ingredients;
    }
    
    // Visually spawn an ingredient at this station
    public GameObject SpawnIngredientVisual(string ingredientName, int slotIndex = 0)
    {
        // Find the prefab for this ingredient
        GameObject prefab = null;
        int ingredientIndex = availableIngredients.IndexOf(ingredientName);
        
        if (ingredientIndex >= 0 && ingredientIndex < ingredientPrefabs.Length)
        {
            prefab = ingredientPrefabs[ingredientIndex];
        }
        
        if (prefab == null)
        {
            Debug.LogWarning("No prefab found for ingredient: " + ingredientName);
            return null;
        }
        
        // Determine position
        Vector3 position = transform.position;
        if (slotIndex < itemPositions.Length)
        {
            position = itemPositions[slotIndex].position;
        }
        
        // Spawn the visual
        GameObject visual = Instantiate(prefab, position, Quaternion.identity);
        return visual;
    }
}

// Types of stations in the game
public enum StationType
{
    Pan,
    Salchicha,
    Toppings,
    Bebidas,
    Descarte
}
