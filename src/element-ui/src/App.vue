<template>
    <div>
        <div id="header">七牛在线存图</div>
        <div id="app">
            <el-form ref="form" label-width="80px">
                <el-form-item label="AccessKey">
                    <el-input v-model="accessKey" clearable placeholder="请输入您的七牛accesskey" required></el-input>
                </el-form-item>
                <el-form-item label="SecretKey">
                    <el-input v-model="secretKey" clearable placeholder="请输入您的七牛secretkey" required></el-input>
                </el-form-item>
                <el-table :data="buckets" style="width: 100%">
                    <el-table-column prop="bucket" label="bucket" width="200">
                        <template slot-scope="scope">
                            <el-input v-if="scope.row.isEditing" v-model="scope.row.bucket" clearable placeholder="bucket"></el-input>
                            <template v-else>{{scope.row.bucket}}</template>
                        </template>
                    </el-table-column>
                    <el-table-column prop="domain" label="域名" width="300">
                        <template slot-scope="scope">
                            <el-input v-if="scope.row.isEditing" v-model="scope.row.domain" clearable placeholder="填入您的域名"></el-input>
                            <template v-else>{{scope.row.domain}}</template>
                        </template>
                    </el-table-column>
                    <el-table-column prop="allDirs" label="子文件夹列表">
                        <template slot-scope="scope">
                            <template v-if="!scope.row.isEditing">
                                <el-tag :key="tag" v-for="tag in scope.row.allDirs" :disable-transitions="true">
                                    {{tag === '' ? '根目录' : tag}}
                                </el-tag>
                            </template>
                            <template v-else>
                                <el-tag
                                        :key="tag"
                                        v-for="(tag, index) in scope.row.allDirs"
                                        closable
                                        :disable-transitions="true"
                                        @close="handleCloseTag(index, scope.row)">
                                    {{tag === '' ? '根目录' : tag}}
                                </el-tag>
                                <el-input
                                        class="input-new-tag"
                                        v-if="scope.row.inputVisible"
                                        v-model="scope.row.inputValue"
                                        ref="saveTagInput"
                                        size="small"
                                        placeholder="目录不需要以/开始"
                                        @keyup.enter.native="handleInputConfirm(scope.row.inputValue, scope.row)"
                                        @blur="handleInputConfirm(scope.row.inputValue, scope.row)"
                                >
                                </el-input>
                                <el-button v-else class="button-new-tag" size="small" @click="showInput(scope.row)">+ New Tag</el-button>
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200">
                        <template slot-scope="scope">
                            <el-button @click="handleClick('edit', scope.$index, scope.row, scope)" type="text" size="small">{{ scope.row.isEditing ? '确认' : '编辑' }}</el-button>
                            <el-button @click="handleClick('delete', scope.$index, scope.row, buckets)" type="text" size="small">删除</el-button>
                            <el-button @click="handleClick('cancel', scope.$index, scope.row)" type="text" v-if="scope.row.isEditing" size="small">取消</el-button>
                            <el-button @click="handleClick('add', scope.$index, scope.row, buckets)" type="text" v-if="scope.$index === scope.store.states.data.length - 1" size="small">新增</el-button>
                        </template>
                    </el-table-column>
                    <el-table-column prop="isDefault" label="是否默认" width="80">
                        <template slot-scope="scope">
                            <el-button @click="setDefault(scope.$index, buckets)" type="text" size="small" v-if="!scope.row.isDefault">设为默认</el-button>
                            <el-tag type="success" v-else>默认</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
                <el-form-item style="margin-top: 20px;">
                    <el-button type="primary" @click="onSubmit">保存一下</el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>
<script>
    import ElButton from "element-ui/packages/button/src/button";

    export default {
        components: {ElButton},
        created() {
            qiniuController.getSetting()
                .then((data) => {
                    if(data) {
                        this.accessKey = data.accessKey;
                        this.secretKey = data.secretKey;
                        this.buckets = data.buckets;
                    }
                });
        },
        data() {
            return {
                accessKey: '',
                secretKey: '',
                buckets: [{
                    bucket: '',
                    domain: '',
                    allDirs: [''],
                    defaultDir: '',
                    isEditing: false,
                    isDefault: true,
                    inputVisible: false,
                    inputValue: '',
                }]
            }
        },
        methods: {
            onSubmit() {
                qiniuController.setSetting(this.$data)
                    .then(() => {
                        this.$message({
                            message: '保存成功',
                            type: 'success'
                        });
                    });
            },
            handleInputConfirm(inputValue, row) {
                if(row.allDirs.indexOf(inputValue) === -1 && inputValue.indexOf('/') !== 0) {
                    row.allDirs.push(inputValue);
                    row.inputVisible = false;
                    row.inputValue = '';
                }
            },
            setDefault(index, buckets) {
                buckets.forEach((tr, key) => {
                    if(key !== index) {
                        tr.isDefault = false;
                    } else {
                        tr.isDefault = true;
                    }
                });
            },
            showInput(row) {
                row.inputVisible = true;
                this.$nextTick(_ => {
                    this.$refs.saveTagInput.$refs.input.focus();
                });
            },
            handleCloseTag(index, row) {
                if(row.allDirs[index]) {
                    row.allDirs.splice(index, 1);
                } else {
                    this.$message({
                        message: '不能删除bucket根目录上传地址',
                        type: 'warning'
                    });
                }
            },
            handleClick(action, index, row, buckets) {
                if(action === 'delete') {
                    if(row.isDefault) {
                        this.$message({
                            message: '该bucket为默认，不能删除',
                            type: 'warning'
                        });
                        return;
                    }
                    this.$confirm('确认删除该bucket配置吗?', '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }).then(() => {
                        buckets.splice(index, 1);
                    }).catch(() => {});
                } else if(action === 'edit') {
                    if(row.isEditing) {
                        // 将已有的值设置进row里面
                        // 正在编辑中，现在用户点击确定
                    } else {
                        // 用户准备编辑, 预先保存一下
                        row._bucket = row.bucket;
                        row._domain = row.domain;
                        row._subfolder = row.subfolder;
                    }
                    row.isEditing = !row.isEditing;
                } else if(action === 'add') {

                    buckets.push({
                        bucket: '',
                        domain: '',
                        allDirs: [''],
                        defaultDir: '',
                        isEditing: true,
                        isDefault: false,
                        inputVisible: false,
                        inputValue: '',
                    });


                } else if(action === 'cancel') {
                    row.isEditing = false;
                    row.bucket = row._bucket;
                    row.domain = row._domain;
                    row.subfolder = row._subfolder;
                }
            }
        }
    }
</script>
<style>
    body {
        margin: 0;
        padding: 0;
    }
    #app {
        width: 1200px;
        margin: 0 auto;
    }
    #header {
        margin-bottom: 20px;
        padding-left: 20px;
        border: 1px solid #e7e7e7;
        height: 50px;
        color: #777;
        line-height: 50px;
        font-size: 16px;
        background-color: #f8f8f8;
    }
    .el-tag + .el-tag {
        margin-left: 10px;
    }
    .button-new-tag {
        margin-left: 10px;
        height: 32px;
        line-height: 30px;
        padding-top: 0;
        padding-bottom: 0;
    }
    .input-new-tag {
        width: 90px;
        margin-left: 10px;
        vertical-align: bottom;
    }
</style>
