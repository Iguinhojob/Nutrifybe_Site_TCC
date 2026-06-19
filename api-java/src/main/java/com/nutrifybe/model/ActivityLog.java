package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ActivityLog")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String action;
    private String nutriName;
    private String timestamp;

    public Long getId() { return id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getNutriName() { return nutriName; }
    public void setNutriName(String nutriName) { this.nutriName = nutriName; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
