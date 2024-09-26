import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:4000/test");
        const result = await response.json();
      
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div>{data ? JSON.stringify(data) : "Loading..."}: through react</div>
    </>
  );
}

export default App;
