import {
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
CartesianGrid,
Legend,
ResponsiveContainer
}
from "recharts";

import {
useEffect,
useState
}
from "react";

function RectangleGraphCard(){

const[
data,
setData
]=
useState([]);

const[
loading,
setLoading
]=
useState(true);


useEffect(()=>{

const token =
localStorage
.getItem(
"token"
);

fetch(
`${import.meta.env.VITE_API_BASE_URL}/api/manager/kpi/history`,
{
headers:{
Authorization:
`Bearer ${token}`
}
}
)

.then(
res=>{

if(
!res.ok
){

throw new Error(
"Failed"
);

}

return res.json();

}
)

.then(
result=>{

console.log(
result
);

setData(
result.chart
||
[]
);

}
)

.catch(
console.error
)

.finally(
()=>{

setLoading(
false
);

}
);

},
[]);


if(
loading
){

return(

<div>

Loading...

</div>

);

}


return(

<div
className=
"mx-3 mb-2 flex-grow-1"

style={{

height:
"380px",

padding:
"20px",

background:
"#fff",

borderRadius:
"15px"

}}

>

<h4>

KPI Progress Over Time

</h4>

<h5
style={{
color:"#888"
}}
>

Expected vs Actual vs Forecast

</h5>

<div
style={{

width:
"100%",

height:
"300px"

}}
>

<ResponsiveContainer>

<LineChart
data={
data
}
>

<CartesianGrid
strokeDasharray=
"3 3"
/>

<XAxis
dataKey=
"time"
/>

<YAxis
domain={[0,100]}
/>

<Tooltip/>

<Legend/>

<Line

type=
"monotone"

dataKey=
"kpi"

stroke=
"#2563eb"

name=
"Expected"

/>

<Line

type=
"monotone"

dataKey=
"progress"

stroke=
"#f59e0b"

name=
"Actual"

/>

<Line

type=
"monotone"

dataKey=
"prediction"

stroke=
"#10b981"

strokeDasharray=
"5 5"

name=
"Forecast"

/>

</LineChart>

</ResponsiveContainer>

</div>

</div>

);

}

export default RectangleGraphCard;