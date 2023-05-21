import { defineStore } from 'pinia'
import axios from "@/plugins/axios"
import { computed, ref, reactive, onMounted } from "vue";
import { useLocalStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

export const UsemyrentStore = defineStore('myrent', () => {
  const router = useRouter()

  const mycar = ref([])
  const checkoutCar = ref([])
  const pickupCar = ref([])
  const returnCar = ref([])
  const historyCar = ref([])

  const hadPay = ref([])
  const hadReturn = ref([])

  async function myrentCar() {
    const fetchingData = await axios.get("myrent/car")
    mycar.value = fetchingData.data
    // console.log(mycar.value.length)
    //filter status
    checkoutCar.value = mycar.value.filter((car) => car.r_status === 'checkout')
    pickupCar.value = mycar.value.filter((car) => car.r_status === 'pickup')
    returnCar.value = mycar.value.filter((car) => car.r_status === 'return')
    historyCar.value = mycar.value.filter((car) => car.r_status === 'history')
    //get payed Id
    const fetchingData1 = await axios.get("myrent/pay")
    hadPay.value = fetchingData1.data
    hadPay.value = hadPay.value.flatMap(obj => Object.values(obj));
    // console.log("pay ", hadReturn.value)
    //get return Id
    const fetchingData2 = await axios.get("myrent/return")
    hadReturn.value = fetchingData2.data
    hadReturn.value = hadReturn.value.flatMap(obj => Object.values(obj));
    // console.log("return ", hadReturn.value)
  }


  const showAlert = ref(false);
  const alertMessage = ref('');
  const confirmResult = ref(null);
  const rentId = ref(0)

  async function showConfirmation(carBrand, carModel, rId) {
    showAlert.value = true;
    alertMessage.value = `คุณต้องการยกเลิกการจองรถ ${carBrand} ${carModel} หรือไม่?`;
    rentId.value = rId
    console.log("rent id ", rentId.value)
  };

  async function confirm(result) {
    confirmResult.value = result;
    showAlert.value = false;
    if (result) {
      // ถ้ากดตกลงก็จะลบ card
      const fetchingData = await axios.post("/myrent/remove", {
        rentId: rentId.value
      })
      checkoutCar.value = checkoutCar.value.filter((car) => car.r_id !== rentId.value)
      const sweet = Swal.fire({
        icon: "success",
        title: 'ยกเลิกการจองรถสำเร็จ',
        confirmButtonText: 'OK',
        confirmButtonColor: '#41BEB1'
      })
    }
  }

  async function btnPickup(rId) {
    console.log("id ", rId)
    try{
      const fetchingData = await axios.put(`/myrent/pickup/${rId}`)
      pickupCar.value = pickupCar.value.filter((car) => car.r_id !== rId)

      returnCar.value = mycar.value.filter((car) => car.r_status === 'return' || car.r_id === rId)
      console.log("add", returnCar.value)
      const sweet = Swal.fire({
        icon: "success",
        title: 'ยืนยันการรับรถ',
        confirmButtonText: 'OK',
        confirmButtonColor: '#41BEB1'
      })
    }catch(error){
      console.log(error)
    }
   
  }


  async function btnReturn(rId) {
    console.log("id ", rId)
    try {
      const fetchingData = await axios.post(`/myrent/return/${rId}`)
      const sweet = Swal.fire({
        icon: "success",
        title: 'รอการตรวจสอบการคืนรถ',
        confirmButtonText: 'OK',
        confirmButtonColor: '#41BEB1'
      })
    } catch (error) {
      const sweet = Swal.fire({
        icon: "error",
        title: 'ขออภัย เกิดข้อผิดพลาดบางอย่าง',
        confirmButtonText: 'OK',
        confirmButtonColor: '#41BEB1'
      })

    }
  }

  const returnCarId = ref("")
  const showAlertVerified = ref(false)
  async function showConfirmReturnCar(carBrand, carModel, uName, reId) {
    showAlertVerified.value = true;
    alertMessage.value = `คุณต้องการยืนยันการคืนรถ ${carBrand} ${carModel} ของคุณ ${uName} หรือไม่?`;
    returnCarId.value = reId
    console.log("reid ", returnCarId.value)
  };

  //get info for admin return page
  const allReturncar = ref([]);
  const FetchReturncar = async () => {
      const fetchingData = await axios.get("/admin/return");
      allReturncar.value = fetchingData.data;
      // console.log(fetchingData)
  };
  
  async function confirmVerified(result) {
    confirmResult.value = result;
    showAlertVerified.value = false;
    if (result) {
      try {
        const response = await axios.put(`/admin/return/${returnCarId.value}`);
        const sweet = Swal.fire({
          icon: "success",
          title: 'ยืนยันการคืนรถสำเร็จแล้ว!', 
          confirmButtonText: 'OK',
          confirmButtonColor: '#41BEB1'
        })
        allReturncar.value = allReturncar.value.filter((car) => car.re_id !== returnCarId.value)
      } catch (error) {
        console.error(error);
        const response = await axios.put(`/admin/return/${returnCarId.value}`);
        const sweet = Swal.fire({
          icon: "error",
          title: 'ยืนยันการคืนรถไม่สำเร็จ อาจเกิดข้อผิดพลาดบางอย่าง!', 
          confirmButtonText: 'OK',
          confirmButtonColor: '#41BEB1'
        })
      }
    }
  }
  
  return {
    myrentCar,
    mycar,
    mycar,
    checkoutCar,
    pickupCar,
    returnCar,
    historyCar,
    showAlert,
    alertMessage,
    confirmResult,
    showConfirmation,
    confirm,
    hadPay,
    btnPickup,
    btnReturn,
    hadReturn,
    showConfirmReturnCar,
    FetchReturncar,
    allReturncar,
    confirmVerified,
    showAlertVerified
  }
})