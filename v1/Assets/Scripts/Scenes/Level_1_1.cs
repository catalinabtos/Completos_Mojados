using UnityEngine;
using System.Collections;
using UnityEngine.UI;

// Main script for Level 1-1 scene
public class Level_1_1 : MonoBehaviour
{
    [Header("Game Managers")]
    public GameManager gameManager;
    public LevelManager levelManager;
    public InputController inputController;
    
    [Header("Stations")]
    public GameObject panStation;
    public GameObject salchichaStation;
    public GameObject toppingStation;
    public GameObject bebidasStation;
    public GameObject descarteStation;
    
    [Header("Tables")]
    public GameObject[] tables;
    
    [Header("Queue")]
    public Transform[] queuePositions;
    
    [Header("UI")]
    public HUDController hudController;
    
    [Header("Prefabs")]
    public GameObject customerPrefab;
    
    // Internal tracking
    private bool isLevelInitialized = false;
    
    void Start()
    {
        // Delay initialization slightly to ensure all components are ready
        Invoke("InitializeLevel", 0.2f);
    }
    
    void InitializeLevel()
    {
        if (isLevelInitialized)
            return;
            
        // Find managers if not assigned
        if (gameManager == null)
            gameManager = FindObjectOfType<GameManager>();
            
        if (levelManager == null)
            levelManager = FindObjectOfType<LevelManager>();
            
        if (inputController == null)
            inputController = FindObjectOfType<InputController>();
            
        if (hudController == null)
            hudController = FindObjectOfType<HUDController>();
        
        // Initialize stations
        InitializeStations();
        
        // Initialize tables
        InitializeTables();
        
        // Set up level manager references
        if (levelManager != null)
        {
            // Set station references
            GameObject[] stations = new GameObject[5];
            if (panStation != null) stations[0] = panStation;
            if (salchichaStation != null) stations[1] = salchichaStation;
            if (toppingStation != null) stations[2] = toppingStation;
            if (bebidasStation != null) stations[3] = bebidasStation;
            if (descarteStation != null) stations[4] = descarteStation;
            levelManager.stations = stations;
            
            // Set table positions
            Transform[] tableTransforms = new Transform[tables.Length];
            for (int i = 0; i < tables.Length; i++)
            {
                if (tables[i] != null)
                {
                    tableTransforms[i] = tables[i].transform;
                }
            }
            levelManager.tablePositions = tableTransforms;
            
            // Set queue positions
            levelManager.queuePositions = queuePositions;
            
            // Set customer prefab
            levelManager.customerPrefab = customerPrefab;
        }
        
        // Mark initialization as complete
        isLevelInitialized = true;
        
        Debug.Log("Level 1-1 initialized successfully!");
    }
    
    void InitializeStations()
    {
        // Configure each station based on type
        ConfigureStation(panStation, StationType.Pan, 0.3f);
        ConfigureStation(salchichaStation, StationType.Salchicha, 0.5f);
        ConfigureStation(toppingStation, StationType.Toppings, 0f);
        ConfigureStation(bebidasStation, StationType.Bebidas, 0f);
        ConfigureStation(descarteStation, StationType.Descarte, 0.5f);
    }
    
    void ConfigureStation(GameObject stationObj, StationType type, float cooldown)
    {
        if (stationObj == null)
            return;
            
        StationController controller = stationObj.GetComponent<StationController>();
        if (controller == null)
        {
            controller = stationObj.AddComponent<StationController>();
        }
        
        controller.type = type;
        controller.cooldownTime = cooldown;
        
        // Additional configuration could be done here based on type
    }
    
    void InitializeTables()
    {
        // Initialize each table with its index
        for (int i = 0; i < tables.Length; i++)
        {
            if (tables[i] != null)
            {
                TableController controller = tables[i].GetComponent<TableController>();
                if (controller == null)
                {
                    controller = tables[i].AddComponent<TableController>();
                }
                
                controller.TableIndex = i;
            }
        }
    }
    
    // This would typically be called by a button in the test UI
    public void StartLevel()
    {
        if (levelManager != null)
        {
            // Any additional level start logic could go here
        }
    }
    
    // Called when level objectives are met
    public void LevelComplete()
    {
        if (hudController != null)
        {
            hudController.ShowLevelComplete();
        }
        
        // Save game metrics
        if (gameManager != null)
        {
            gameManager.SaveGameMetrics();
        }
        
        Debug.Log("Level Complete!");
    }
}
