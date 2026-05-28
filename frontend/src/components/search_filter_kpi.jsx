import React, { useState } from 'react';

function SearchFilterKPI({ searchKPI, setSearchKPI, searchStaff, setSearchStaff, filterCategory, setFilterCategory, filterStatus, setFilterStatus }) {
  console.log("SearchFilterKPI loaded");

  const title = {
    fontWeight: "bold",
    textAlign: "left",
    fontSize: "14px"
  };

  const fieldStyle = {
    minHeight: "40px",
    lineHeight: "40px",
    height: "20px",
    width: "230px",
    padding: "0 12px",
    fontSize: "14px",
    borderRadius: "15px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    backgroundColor: "#f9f9f9",
    color: "#333",
  };

  

  return (
    <div
      className="d-flex justify-content-center mx-3 mb-2 flex-grow-1"
      style={{
        flexDirection: "column",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "15px",
        padding: "20px",
      }}>
      <h2
        style={{
          textAlign: "left",
          fontSize: "16px",
        }}>Search and FIlter</h2>

      <div
        className="d-flex justify-item-center"
        style={{
          flexDirection: "row",
          width: "100%",
          gap: "30px",
          flexWrap: "wrap",
        }}>

        <div
          className="d-flex flex-grow-1"
          style={{
            flexDirection: "column",
            textAlign: "left",
          }}>
          <p style={title}>Search KPI</p>
          <input
            type="text"
            placeholder="  Search KPI... "
            value={searchKPI}
            onChange={(e) => setSearchKPI(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div
          className="d-flex flex-grow-1"
          style={{
            flexDirection: "column",
            textAlign: "left",
          }}>
          <p style={title}>Search Staff</p>
          <input
            type="text"
            placeholder="  Search Staff..."
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div
          className="d-flex flex-grow-1"
          style={{
            fontSize: "14px",
            flexDirection: "column",
            textAlign: "left",
          }}>
          <p style={title}>Filter Category</p>
          <select
            style={{
              ...fieldStyle,
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="cat_1">Sales Performance</option>
            <option value="cat_2">Lead Generation</option>
            <option value="cat_3">Property Management</option>
            <option value="cat_4">Marketing Performance</option>
            <option value="cat_5">Customer Experience</option>
          </select>
        </div>

        <div
          className="d-flex flex-grow-1"
          style={{
            flexDirection: "column",
            textAlign: "left",
          }}>
          <p style={title}>Filter Status</p>
          <select
            style={{
              ...fieldStyle,
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="at_risk">At Risk</option>
          </select>
        </div>
      </div>
    </div>

  )
}

export default SearchFilterKPI;