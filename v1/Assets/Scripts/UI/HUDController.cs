using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

// Controls the Heads-Up Display (HUD) for the game
public class HUDController : MonoBehaviour
{
    [Header("Money Display")]
    public Text moneyText;
    public Text goalText;
    public Image moneyProgressBar;
    
    [Header("Timer Display")]
    public Text timerText;
    public Image timerProgressBar;
    
    [Header("Combo Display")]
    public Text comboText;
    public GameObject comboPanel;
    
    [Header("Buttons")]
    public Button pauseButton;
    
    [Header("Panels")]
    public GameObject pausePanel;
    public GameObject levelCompletePanel;
    public GameObject levelFailedPanel;
    
    [Header("Level Complete")]
    public Text finalMoneyText;
    public Text perfectOrdersText;
    public Text abandonedCustomersText;
    public Text maxComboText;
    
    // Internal references
    private LevelManager levelManager;
    private float levelDuration = 240f; // 4 minutes max duration
    private float levelTimeRemaining;
    
    void Start()
    {
        // Find the level manager
        levelManager = FindObjectOfType<LevelManager>();
        
        // Set initial time
        levelTimeRemaining = levelDuration;
        
        // Hide non-HUD panels
        if (pausePanel != null)
            pausePanel.SetActive(false);
            
        if (levelCompletePanel != null)
            levelCompletePanel.SetActive(false);
            
        if (levelFailedPanel != null)
            levelFailedPanel.SetActive(false);
            
        // Hide combo panel initially
        if (comboPanel != null)
            comboPanel.SetActive(false);
            
        // Set up pause button
        if (pauseButton != null)
            pauseButton.onClick.AddListener(PauseGame);
            
        // Initial UI update
        UpdateUI();
    }
    
    void Update()
    {
        // Don't update if game is paused
        if (GameManager.Instance.isPaused)
            return;
            
        // Update timer
        if (levelTimeRemaining > 0)
        {
            levelTimeRemaining -= Time.deltaTime;
            
            // Update timer UI
            if (timerText != null)
            {
                int minutes = Mathf.FloorToInt(levelTimeRemaining / 60f);
                int seconds = Mathf.FloorToInt(levelTimeRemaining % 60f);
                timerText.text = string.Format("{0:00}:{1:00}", minutes, seconds);
            }
            
            if (timerProgressBar != null)
            {
                timerProgressBar.fillAmount = levelTimeRemaining / levelDuration;
            }
        }
        else
        {
            // Time ran out
            // This could trigger game over or just stop spawning customers
        }
        
        // Update money display
        UpdateMoneyDisplay();
        
        // Update combo display if needed
        UpdateComboDisplay();
    }
    
    private void UpdateUI()
    {
        UpdateMoneyDisplay();
        
        // Set goal text
        if (goalText != null && levelManager != null)
        {
            goalText.text = "Meta: $" + levelManager.targetMoney;
        }
        
        // Set timer initial value
        if (timerText != null)
        {
            int minutes = Mathf.FloorToInt(levelTimeRemaining / 60f);
            int seconds = Mathf.FloorToInt(levelTimeRemaining % 60f);
            timerText.text = string.Format("{0:00}:{1:00}", minutes, seconds);
        }
        
        if (timerProgressBar != null)
        {
            timerProgressBar.fillAmount = 1.0f;
        }
    }
    
    private void UpdateMoneyDisplay()
    {
        if (moneyText != null)
        {
            moneyText.text = "$" + Mathf.FloorToInt(GameManager.Instance.money);
        }
        
        if (moneyProgressBar != null && levelManager != null)
        {
            float progressPercent = Mathf.Clamp01(GameManager.Instance.money / levelManager.targetMoney);
            moneyProgressBar.fillAmount = progressPercent;
        }
    }
    
    private void UpdateComboDisplay()
    {
        // This would be implemented to show the current combo streak
        // For now it's just a placeholder
    }
    
    public void PauseGame()
    {
        GameManager.Instance.PauseGame();
        
        if (pausePanel != null)
            pausePanel.SetActive(true);
    }
    
    public void ResumeGame()
    {
        if (pausePanel != null)
            pausePanel.SetActive(false);
            
        GameManager.Instance.ResumeGame();
    }
    
    public void RestartLevel()
    {
        // Reload the current scene
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
    
    public void ReturnToMenu()
    {
        // This would load the main menu scene
        // For prototype, just reload current scene
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
    
    public void ShowLevelComplete()
    {
        // Pause the game
        GameManager.Instance.PauseGame();
        
        if (levelCompletePanel != null)
        {
            levelCompletePanel.SetActive(true);
            
            // Set final stats
            if (finalMoneyText != null)
                finalMoneyText.text = "$" + Mathf.FloorToInt(GameManager.Instance.money);
                
            if (perfectOrdersText != null)
            {
                float perfectPercent = 0f;
                if (GameManager.Instance.totalOrders > 0)
                {
                    perfectPercent = (float)GameManager.Instance.perfectOrders / GameManager.Instance.totalOrders * 100f;
                }
                perfectOrdersText.text = string.Format("{0}%", Mathf.RoundToInt(perfectPercent));
            }
            
            if (abandonedCustomersText != null)
                abandonedCustomersText.text = GameManager.Instance.abandonedCustomers.ToString();
                
            if (maxComboText != null)
                maxComboText.text = GameManager.Instance.maxCombo.ToString() + "x";
        }
    }
    
    public void ShowLevelFailed()
    {
        // Pause the game
        GameManager.Instance.PauseGame();
        
        if (levelFailedPanel != null)
        {
            levelFailedPanel.SetActive(true);
        }
    }
    
    // Show a short-lived popup message
    public void ShowPopupMessage(string message, Vector3 position, float duration = 2f)
    {
        // This would create a temporary text element that fades out
        // Implementation depends on the UI system being used
        Debug.Log("Popup: " + message);
    }
}
