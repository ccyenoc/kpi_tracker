import React, { useState } from 'react';

//TODO: Combine with staff_search_filter_kpi.jsx and make it more generic for both manager and staff use.
function SearchFilterKPI({ searchKPI, setSearchKPI, searchStaff, setSearchStaff, filterCategory, setFilterCategory, filterStatus, setFilterStatus, users = [] }) {
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const staffList = users.filter(u => u.role === "staff" || !u.role);
  const filteredStaff = staffList.filter(
    (staff) =>
      searchStaff === "" ||
      staff.name.toLowerCase().includes(searchStaff.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchStaff.toLowerCase())
  );
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
            position: "relative"
          }}>
          <p style={title}>Search Staff</p>
          <input
            type="text"
            placeholder="  Search Staff... (click to see all)"
            value={searchStaff}
            onChange={(e) => setSearchStaff(e.target.value)}
            onFocus={() => setShowStaffDropdown(true)}
            onBlur={() => setTimeout(() => setShowStaffDropdown(false), 200)}
            style={fieldStyle}
          />
          {showStaffDropdown && filteredStaff.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                right: "0",
                border: "1px solid #eee",
                borderRadius: "10px",
                marginTop: "5px",
                background: "#fff",
                zIndex: 1000,
                maxHeight: "300px",
                overflowY: "auto",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    fontSize: "14px",
                    transition: "background-color 0.2s"
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchStaff(staff.name);
                    setShowStaffDropdown(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {staff.name} ({staff.email})
                </div>
              ))}
            </div>
          )}
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
            <option value="sales">Sales Performance</option>
            <option value="lead">Lead Generation</option>
            <option value="property">Property Management</option>
            <option value="marketing">Marketing Performance</option>
            <option value="customer">Customer Experience</option>
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
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="at_risk">At Risk</option>
            <option value="underperformed">Underperformed</option>
          </select>
        </div>
      </div>
    </div>

  )
}

export default SearchFilterKPI;