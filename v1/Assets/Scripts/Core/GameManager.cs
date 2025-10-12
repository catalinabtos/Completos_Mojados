using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.IO;

// Main game manager class - singleton to control global game state
public class GameManager : MonoBehaviour
{
    // Singleton instance
    public static GameManager Instance { get; private set; }

    // Game configuration
    public TextAsset recipesJson;
    public TextAsset levelsJson;
    
    // Game state variables
    [HideInInspector] public bool isPaused = false;
    [HideInInspector] public int currentWorld = 1;
    [HideInInspector] public int currentLevel = 1;
    [HideInInspector] public float money = 0;
    [HideInInspector] public int perfectOrders = 0;
    [HideInInspector] public int totalOrders = 0;
    [HideInInspector] public int maxCombo = 0;
    [HideInInspector] public int abandonedCustomers = 0;
    
    // Game configuration data
    public Dictionary<string, List<string>> Recipes { get; private set; }
    public List<LevelData> Levels { get; private set; }
    
    void Awake()
    {
        // Singleton pattern
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadGameData();
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    // Load recipes and levels data from JSON files
    void LoadGameData()
    {
        if (recipesJson == null)
        {
            recipesJson = Resources.Load<TextAsset>("Configs/recipes");
        }
        
        if (levelsJson == null)
        {
            levelsJson = Resources.Load<TextAsset>("Configs/levels");
        }
        
        if (recipesJson != null)
        {
            RecipesData recipesData = JsonUtility.FromJson<RecipesData>(recipesJson.text);
            // Process recipes data
        }
        
        if (levelsJson != null)
        {
            LevelsData levelsData = JsonUtility.FromJson<LevelsData>(levelsJson.text);
            Levels = levelsData.levels;
        }
    }
    
    public void PauseGame()
    {
        isPaused = true;
        Time.timeScale = 0f;
    }
    
    public void ResumeGame()
    {
        isPaused = false;
        Time.timeScale = 1f;
    }
    
    public void SaveGameMetrics()
    {
        GameMetrics metrics = new GameMetrics
        {
            level = currentLevel,
            world = currentWorld,
            money = money,
            perfectOrdersPercentage = (totalOrders > 0) ? (float)perfectOrders / totalOrders * 100 : 0,
            maxCombo = maxCombo,
            abandonedCustomers = abandonedCustomers
        };
        
        string json = JsonUtility.ToJson(metrics, true);
        string filePath = Application.persistentDataPath + "/game_metrics.json";
        File.WriteAllText(filePath, json);
        
        Debug.Log("Game metrics saved to: " + filePath);
    }
}

// Data structures for JSON parsing
[System.Serializable]
public class RecipesData
{
    public List<string> base_ingredients;
    public Dictionary<string, List<string>> completos;
    public List<string> extras;
    public List<string> bebidas;
}

[System.Serializable]
public class LevelData
{
    public int world;
    public int level;
    public int goal_money;
    public int tables;
    public int queue_slots;
    public int customers;
    public Dictionary<string, float> order_mix;
    public Dictionary<string, float> timers;
    public bool beverages_enabled;
    public List<string> toppings_enabled;
}

[System.Serializable]
public class LevelsData
{
    public List<LevelData> levels;
}

[System.Serializable]
public class GameMetrics
{
    public int level;
    public int world;
    public float money;
    public float perfectOrdersPercentage;
    public int maxCombo;
    public int abandonedCustomers;
}
