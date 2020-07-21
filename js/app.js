import zh from "./zh_TW.js";
import Pagination from "../components/pagination.js";

// 將 VeeValidate input 驗證工具載入 作為全域註冊
Vue.component('ValidationProvider', VeeValidate.ValidationProvider);
// 將 VeeValidate 完整表單 驗證工具載入 作為全域註冊
Vue.component('ValidationObserver', VeeValidate.ValidationObserver);
// 全域註冊 VueLoading 標籤設定為 loading
Vue.component('loading', VueLoading);

Vue.filter('money', function (num) {
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return 'NT ' + parts.join('.');
});

// 自訂設定檔案，錯誤的 className
VeeValidate.configure({
  classes: {
    valid: 'is-valid',
    invalid: 'is-invalid',
  },
});
VeeValidate.localize('tw', zh);

new Vue({
  el:'#app',
  data(){
    return{
      uuid: 'c7010afc-c576-4a2b-9f0e-5a42977d6066',
      apiPath:'https://course-ec-api.hexschool.io/api/',
      products: [],
      product:{
        num: 0,
      },
      pagination: {},
      status:{
        loadingItem:'',
      },
      isLoading: false,
      cart:{},
      cartTotal: 0,
      form:{
        email: '',
        name: '',
        tel: '',
        address: '',
        payment: '',
        message: '',
      },
    };
  },
  created(){
    this.getProducts();
    this.getCart();
  },
  components:{
    Pagination,
  },
  methods:{
    getProducts(page = 1){
      const vm = this;
      const url = `${vm.apiPath}${vm.uuid}/ec/products?page=${page}`;
      // 預設帶入 token
      vm.isLoading = true;
      axios.get(url).then((res) =>{
        vm.isLoading = false;
        vm.products = res.data.data;
        vm.pagination = res.data.meta.pagination;
      }).catch((error) =>{
        console.log(error);
        vm.isLoading = false;
      });
    },
    getProduct(id){
      const vm = this;
      vm.status.loadingItem = id;
      const url =`${vm.apiPath}${vm.uuid}/ec/product/${id}`;
      axios.get(url).then((res) =>{
        vm.product = res.data.data;
        // 因為 product 的 num 沒有預設數字
        // options 無法選擇預設欄位，因此增加一行解決改問題
        // 如果直接使用物件新增屬性雙向綁定會失效，所以要使用 $set
        this.$set(vm.product, 'num', 0);
        $('#productModal').modal('show');
        vm.status.loadingItem = '';
      }).catch((error) =>{
        console.log(error);
      });
    },
    amount(){
      const vm = this;
      let total = 0;
      vm.cart.forEach(item =>{
        console.log(item);
        total += item.product.price * item.quantity;        
      });
      vm.cartTotal = total;
    },
    addToCart(item, quantity = 1){
      const vm = this;
      vm.status.loadingItem = item.id;
      const url = `${vm.apiPath}${vm.uuid}/ec/shopping`;
      const cart = {
        product:item.id,
        quantity,
      }
      axios.post(url, cart).then(() =>{
        vm.status.loadingItem = '';
        $('#productModal').modal('hide');
        vm.getCart();
        Swal.fire({
          toast: true,
          title: '已加入購物車',
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
          padding: '1em',
          position: 'bottom-end',
        });
      }).catch(err =>{
        vm.status.loadingItem = '';
        console.log(err.response.data.errors);
        $('#productModal').modal('hide');
        Swal.fire({
          toast: true,
          title: `${err.response.data.errors}`,
          icon: 'warning',
          showConfirmButton: false,
          timer: 2000,
          padding: '1em',
          position: 'bottom-end',
        });
      });
    },
    getCart(){
      const vm = this;
      vm.isLoading = true;
      const url = `${vm.apiPath}${vm.uuid}/ec/shopping`;
      axios.get(url).then(res =>{
        vm.cart = res.data.data;
        this.isLoading = false;
      }).catch(err => {
        console.log(err);  
      });
    },
    quantityUpdata(id, num){
      const vm = this;
      vm.isLoading = true;
      const url = `${vm.apiPath}${vm.uuid}/ec/shopping`;
      const data = {
        product: id,
        quantity: num,
      };
      axios.patch(url, data).then(() =>{
        vm.isLoading = false;
        vm.getCart();
      });
    },
    removeCartItem(id){
      const vm = this;
      vm.isLoading = true;
      const url = `${vm.apiPath}${vm.uuid}/ec/shopping/${id}`;
      axios.delete(url).then(() => {
        vm.isLoading = false;
        vm.getCart();
        Swal.fire({
          toast: true,
          title: '商品已刪除',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          padding: '1em',
          position: 'bottom-end',
        });
      })
      .catch(err => {
        console.log(err);
        Swal.fire({
          toast: true,
          title: '商品刪除失敗',
          icon: 'error',
          showConfirmButton: false,
          timer: 1500,
          padding: '1em',
          position: 'bottom-end',
        });
      });
    },
    removeAllCartItem(){
      const vm =this;
      vm.isLoading = true;
      const url = `${vm.apiPath}${vm.uuid}/ec/shopping/all/product`;
      axios.delete(url)
      .then(() => {
        vm.isLoading = false;
        vm.getCart();
        vm.cartTotal = 0;
        Swal.fire({
          toast: true,
          title: '商品已全部刪除',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          padding: '1em',
          position: 'bottom-end',
        });
      }).catch(err => {
        console.log(err);
        Swal.fire({
          toast: true,
          title: '商品刪除失敗',
          icon: 'error',
          showConfirmButton: false,
          timer: 1500,
          padding: '1em',
          position: 'bottom-end',
        });
      });
    },
    createOrder(){
      const vm = this;
      vm.isLoading = true;
      const url =`${vm.apiPath}${vm.uuid}/ec/orders`;
      const order = Object.assign({}, vm.form);
      axios.post(url, order).then(res =>{
        vm.isLoading = false;
        // 跳出提示訊息
        Swal.fire({
          toast: true,
          title: '訂單完成',
          icon: 'success',
          showConfirmButton: false,
          timer: 2500,
          padding: '1em',
          position: 'bottom-end',
        });
        $('#orderModal').modal('hide');
        //重新渲染購物車
        vm.getCart();
      }).catch(err =>{
        vm.isLoading =false;
        console.log(err.response.data.errors);
      })
    }
  }
})
    