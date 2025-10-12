using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;

// Manages the current level gameplay
public class LevelManager : MonoBehaviour
{
    [Header("Level Configuration")]
    public int targetMoney = 100;
    public int currentCustomerCount = 0;
    public int maxCustomers = 12;
    
    [Header("References")]
    public GameObject customerPrefab;
    public Transform[] tablePositions;
    public Transform[] queuePositions;
    public GameObject[] stations;  // pan, salchicha, toppings, bebidas, descarte
    
    [Header("UI References")]
    public Text moneyText;
    public Text goalText;
    public Button pauseButton;
    
    // Internal tracking
    private int currentCombo = 0;
    private List<GameObject> activeCustomers = new List<GameObject>();
    private float customerSpawnTimer = 0f;
    private float customerSpawnInterval = 7f;  // Initial spawn rate
    private bool isLevelComplete = false;
    private LevelData currentLevelData;
    
    void Start()
    {
        InitializeLevel();
    }
    
    void Update()
    {
        if (GameManager.Instance.isPaused || isLevelComplete)
            return;
            
        // Spawn customers over time
        ManageCustomerSpawning();
        
        // Update UI
        UpdateUI();
        
        // Check level completion
        CheckLevelCompletion();
    }
    
    private void InitializeLevel()
    {
        // Load current level data
        currentLevelData = GetCurrentLevelData();
        
        if (currentLevelData != null)
        {
            targetMoney = currentLevelData.goal_money;
            maxCustomers = currentLevelData.customers;
        }
        
        // Initialize UI
        UpdateUI();
        
        // Start spawning customers
        StartCoroutine(SpawnInitialCustomers());
    }
    
    private LevelData GetCurrentLevelData()
    {
        if (GameManager.Instance.Levels != null && GameManager.Instance.Levels.Count > 0)
        {
            foreach (var level in GameManager.Instance.Levels)
            {
                if (level.world == GameManager.Instance.currentWorld && 
                    level.level == GameManager.Instance.currentLevel)
                {
                    return level;
                }
            }
        }
        
        // Default level data if not found
        return new LevelData
        {
            world = 1,
            level = 1,
            goal_money = 100,
            tables = 4,
            queue_slots = 3,
            customers = 12,
            timers = new Dictionary<string, float>
            {
                { "patience", 18f },
                { "prep_pan", 0.3f },
                { "prep_sausage", 0.5f }
            }
        };
    }
    
    private IEnumerator SpawnInitialCustomers()
    {
        // Spawn first 3 customers (or however many queue slots we have)
        for (int i = 0; i < Mathf.Min(currentLevelData.queue_slots, 3); i++)
        {
            SpawnCustomer();
            yield return new WaitForSeconds(1.5f);
        }
    }
    
    private void ManageCustomerSpawning()
    {
        // Only spawn if we haven't reached max customers and there's room in queue
        if (currentCustomerCount >= maxCustomers)
            return;
            
        customerSpawnTimer += Time.deltaTime;
        
        if (customerSpawnTimer >= customerSpawnInterval)
        {
            customerSpawnTimer = 0f;
            
            // Check if there's space in the queue
            int customersInQueue = CountCustomersInQueue();
            if (customersInQueue < currentLevelData.queue_slots)
            {
                SpawnCustomer();
                
                // Adjust spawn interval based on level progression
                // As the level progresses, customers come more frequently
                float progressPercent = (float)currentCustomerCount / maxCustomers;
                customerSpawnInterval = Mathf.Lerp(7f, 5f, progressPercent);
            }
        }
    }
    
    private int CountCustomersInQueue()
    {
        int count = 0;
        foreach (var customer in activeCustomers)
        {
            CustomerController controller = customer.GetComponent<CustomerController>();
            if (controller != null && controller.State == CustomerState.Waiting)
            {
                count++;
            }
        }
        return count;
    }
    
    private void SpawnCustomer()
    {
        if (customerPrefab == null || currentCustomerCount >= maxCustomers)
            return;
            
        GameObject customerObj = Instantiate(customerPrefab, GetQueuePosition(), Quaternion.identity);
        CustomerController customer = customerObj.GetComponent<CustomerController>();
        
        if (customer != null)
        {
            // Initialize customer with level-appropriate settings
            float patienceTime = currentLevelData.timers["patience"];
            Dictionary<string, float> orderDistribution = currentLevelData.order_mix;
            
            customer.Initialize(patienceTime, orderDistribution);
            activeCustomers.Add(customerObj);
            currentCustomerCount++;
        }
    }
    
    private Vector3 GetQueuePosition()
    {
        // Find the first unoccupied queue position
        int queuePos = 0;
        
        for (int i = 0; i < currentLevelData.queue_slots; i++)
        {
            bool isPositionOccupied = false;
            
            foreach (var customer in activeCustomers)
            {
                CustomerController controller = customer.GetComponent<CustomerController>();
                if (controller != null && controller.State == CustomerState.Waiting && 
                    controller.QueuePosition == i)
                {
                    isPositionOccupied = true;
                    break;
                }
            }
            
            if (!isPositionOccupied)
            {
                queuePos = i;
                break;
            }
        }
        
        // Return the appropriate queue position
        if (queuePos < queuePositions.Length)
        {
            return queuePositions[queuePos].position;
        }
        
        // Fallback: return outside the screen and let the CustomerController handle it
        return new Vector3(-10f, 0f, 0f);
    }
    
    private void UpdateUI()
    {
        if (moneyText != null)
        {
            moneyText.text = "$" + Mathf.FloorToInt(GameManager.Instance.money);
        }
        
        if (goalText != null)
        {
            goalText.text = "Meta: $" + targetMoney;
        }
    }
    
    private void CheckLevelCompletion()
    {
        if (GameManager.Instance.money >= targetMoney && currentCustomerCount >= maxCustomers)
        {
            isLevelComplete = true;
            
            // Save game metrics
            GameManager.Instance.SaveGameMetrics();
            
            // Show level complete UI (to be implemented)
            Debug.Log("Level Complete!");
        }
    }
    
    public void ProcessOrderResult(bool isPerfect, float orderValue, int tableIndex)
    {
        // Add money
        GameManager.Instance.money += orderValue;
        
        // Track perfect orders
        GameManager.Instance.totalOrders++;
        if (isPerfect)
        {
            GameManager.Instance.perfectOrders++;
            currentCombo++;
            
            // Update max combo if needed
            if (currentCombo > GameManager.Instance.maxCombo)
            {
                GameManager.Instance.maxCombo = currentCombo;
            }
        }
        else
        {
            // Reset combo on imperfect order
            currentCombo = 0;
        }
        
        // Free up table
        // Implementation depends on how tables are managed
    }
    
    public void CustomerAbandoned()
    {
        GameManager.Instance.abandonedCustomers++;
        currentCombo = 0;  // Reset combo when a customer leaves angry
    }
    
    public void PauseGame()
    {
        GameManager.Instance.PauseGame();
        // Show pause menu (to be implemented)
    }
}

// Enum for customer states
public enum CustomerState
{
    Arriving,
    Waiting,
    Seated,
    Ordering,
    Eating,
    Leaving,
    AngryLeaving
}
